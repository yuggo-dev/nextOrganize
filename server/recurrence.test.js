import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { openDatabase } from "./src/infrastructure/database.js";
import { createApp } from "./src/app.js";

test("daily API keeps independent idempotent history, validates dates and enforces account isolation", async t => {
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
  const owner = await call("/auth/register", "POST", { name: "Ana", email: "ana@example.test", password: "senha-teste-123" });
  const other = await call("/auth/register", "POST", { name: "Bia", email: "bia@example.test", password: "senha-teste-123" });
  const form = { title: "Caminhar", due: "2026-11-14", due_time: "18:00", recurrence: "daily", recurrence_until: "2026-11-20" };
  const created = await call("/tasks", "POST", form, owner.cookie);
  assert.equal(created.status, 201);
  assert.equal(created.body.recurrence, "daily");
  assert.deepEqual(created.body.occurrences, []);
  const id = created.body.id;
  assert.equal((await call("/tasks", "POST", { ...form, due: null, due_time: null }, owner.cookie)).status, 400);
  assert.equal((await call("/tasks", "POST", { ...form, recurrence_until: "2026-11-13" }, owner.cookie)).status, 400);
  assert.equal((await call("/tasks", "POST", { ...form, recurrence: "weekly" }, owner.cookie)).status, 400);
  assert.equal((await call(`/tasks/${id}`, "PATCH", { done: true }, owner.cookie)).status, 400);
  for (const date of ["2026-11-13", "2026-11-21", "2026-02-30"]) {
    assert.equal((await call(`/tasks/${id}`, "PATCH", { done: true, occurrence_date: date }, owner.cookie)).status, 400);
  }
  assert.equal((await call(`/tasks/${id}`, "PATCH", { done: true, occurrence_date: "2026-11-14" }, other.cookie)).status, 404);
  assert.equal((await call(`/tasks/${id}?date=2026-11-14`, "DELETE", undefined, other.cookie)).status, 404);
  const first = await call(`/tasks/${id}`, "PATCH", { done: true, occurrence_date: "2026-11-14" }, owner.cookie);
  assert.equal(first.status, 200);
  assert.equal(first.body.occurrences.length, 1);
  assert.equal(first.body.done, false);
  const retry = await call(`/tasks/${id}`, "PATCH", { done: true, occurrence_date: "2026-11-14" }, owner.cookie);
  assert.equal(retry.body.occurrences.length, 1);
  await Promise.all(["2026-11-15", "2026-11-16"].map(occurrence_date =>
    call(`/tasks/${id}`, "PATCH", { done: true, occurrence_date }, owner.cookie)));
  const list = await call("/tasks", "GET", undefined, owner.cookie);
  assert.equal(list.body[0].occurrences.length, 3);
  assert.ok(list.body[0].occurrences.every(day => day.done));
  const reopened = await call(`/tasks/${id}`, "PATCH", { done: false, occurrence_date: "2026-11-14" }, owner.cookie);
  assert.equal(reopened.body.occurrences.find(day => day.due === "2026-11-14").done, false);
  const skipped = await call(`/tasks/${id}?date=2026-11-15`, "DELETE", undefined, owner.cookie);
  assert.equal(skipped.status, 200);
  assert.equal(skipped.body.occurrences.find(day => day.due === "2026-11-15").skipped, true);
  assert.equal((await call("/tasks", "GET", undefined, other.cookie)).body.length, 0);
  assert.equal((await call(`/tasks/${id}`, "DELETE", undefined, owner.cookie)).status, 204);
  assert.equal(db.prepare("SELECT count(*) AS total FROM task_occurrences").get().total, 0);
});
