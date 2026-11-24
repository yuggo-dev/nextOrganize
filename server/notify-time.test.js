import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openDatabase } from "./src/infrastructure/database.js";
import { createApp } from "./src/app.js";

test("regulares usam horário de notificação e escolha de atraso; pontuais têm horário opcional", async t => {
  const db = openDatabase(":memory:");
  const server = createApp(db, "missing-test-dist").listen(0);
  await once(server, "listening");
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    db.close();
  });
  const base = `http://localhost:${server.address().port}/api`;
  async function call(route, method = "GET", body, cookie) {
    const response = await fetch(base + route, {
      method,
      headers: { "Content-Type": "application/json", "X-Requested-With": "tarefas", ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: response.status === 204 ? null : await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
  }
  const { cookie } = await call("/auth/register", "POST", { name: "Ana", email: "ana@example.test", password: "senha-teste-123" });

  // Regular: notify_time guardado, due_time sempre vazio, atraso ligado por padrão.
  const regular = await call("/tasks", "POST", { title: "Ler", due: "2026-11-20", recurrence: "daily", notify_time: "07:30" }, cookie);
  assert.equal(regular.status, 201);
  assert.equal(regular.body.notify_time, "07:30");
  assert.equal(regular.body.due_time, null);
  assert.equal(regular.body.tracks_overdue, true);

  // Desligar o atraso e remover a notificação.
  const quiet = await call(`/tasks/${regular.body.id}`, "PATCH", { tracks_overdue: false, notify_time: null }, cookie);
  assert.equal(quiet.status, 200);
  assert.equal(quiet.body.tracks_overdue, false);
  assert.equal(quiet.body.notify_time, null);
  // Um PATCH sem esses campos preserva a escolha.
  assert.equal((await call(`/tasks/${regular.body.id}`, "PATCH", { title: "Ler mais" }, cookie)).body.tracks_overdue, false);

  // Validação.
  assert.equal((await call("/tasks", "POST", { title: "X", due: "2026-11-20", recurrence: "daily", notify_time: "25:00" }, cookie)).status, 400);
  assert.equal((await call("/tasks", "POST", { title: "X", due: "2026-11-20", recurrence: "daily", tracks_overdue: "não" }, cookie)).status, 400);

  // Pontual: com e sem horário de conclusão; nunca guarda notify_time.
  const timed = await call("/tasks", "POST", { title: "Reunião", due: "2026-11-21", due_time: "15:00", notify_time: "14:00" }, cookie);
  assert.equal(timed.body.due_time, "15:00");
  assert.equal(timed.body.notify_time, null);
  const untimed = await call("/tasks", "POST", { title: "Comprar pão", due: "2026-11-21" }, cookie);
  assert.equal(untimed.status, 201);
  assert.equal(untimed.body.due_time, null);

  // Virar regular move o horário enviado para notificação.
  const converted = await call(`/tasks/${timed.body.id}`, "PATCH", { recurrence: "daily", notify_time: "09:00" }, cookie);
  assert.equal(converted.body.due_time, null);
  assert.equal(converted.body.notify_time, "09:00");
});

test("SQLite existente: o horário das regulares vira notificação ao iniciar", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "tarefas-notify-"));
  const file = path.join(dir, "old.db");
  try {
    const old = new Database(file);
    old.exec(`CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Pessoal', priority INTEGER NOT NULL DEFAULT 2, due TEXT,
      done INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')), due_time TEXT,
      recurrence TEXT NOT NULL DEFAULT 'none')`);
    old.exec(`INSERT INTO tasks (title, due, due_time, recurrence) VALUES
      ('Rotina', '2026-11-20', '07:00', 'daily'), ('Pontual', '2026-11-20', '10:00', 'none')`);
    old.close();
    const db = openDatabase(file);
    const rows = db.prepare("SELECT title, due_time, notify_time, tracks_overdue FROM tasks ORDER BY id").all();
    db.close();
    assert.deepEqual(rows, [
      { title: "Rotina", due_time: null, notify_time: "07:00", tracks_overdue: 1 },
      { title: "Pontual", due_time: "10:00", notify_time: null, tracks_overdue: 1 },
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
