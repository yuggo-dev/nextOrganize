import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { openDatabase } from "./src/infrastructure/database.js";

test("migration preserves existing owners, categories and deadlines across restarts", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "tarefas-migration-"));
  const filename = path.join(directory, "legacy.db");
  let db = new Database(filename);
  try {
    db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
      INSERT INTO users VALUES (1, 'Antiga', 'antiga@example.test', 'hash');
      CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 2, due TEXT, done INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')), user_id INTEGER REFERENCES users(id));
      INSERT INTO tasks (id, title, category, due, user_id) VALUES (1, 'Tarefa existente', 'Casa', '2026-11-20', 1);`);
    db.close();
    db = openDatabase(filename);
    const task = db.prepare("SELECT * FROM tasks").get();
    assert.equal(task.title, "Tarefa existente");
    assert.equal(task.user_id, 1);
    assert.equal(task.due, "2026-11-20");
    assert.equal(task.due_time, null);
    assert.equal(task.recurrence, "none");
    assert.equal(task.recurrence_until, null);
    assert.ok(task.type_id);
    assert.equal(db.prepare("SELECT name FROM task_types WHERE id = ?").get(task.type_id).name, "Casa");
    const count = db.prepare("SELECT count(*) AS total FROM task_types").get().total;
    db.prepare("UPDATE tasks SET recurrence = 'daily' WHERE id = 1").run();
    db.prepare("INSERT INTO task_occurrences (task_id, due, done) VALUES (1, '2026-11-20', 1)").run();
    db.close();
    db = openDatabase(filename);
    assert.equal(db.prepare("SELECT count(*) AS total FROM task_types").get().total, count);
    assert.equal(db.prepare("SELECT type_id FROM tasks").get().type_id, task.type_id);
    assert.equal(db.prepare("SELECT recurrence FROM tasks").get().recurrence, "daily");
    assert.equal(db.prepare("SELECT done FROM task_occurrences WHERE task_id = 1 AND due = '2026-11-20'").get().done, 1);
  } finally {
    if (db.open) db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
