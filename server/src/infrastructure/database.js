import Database from "better-sqlite3";
import { seedTaskTypes } from "../domains/task-types/repository.js";

export function openDatabase(filename) {
  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.transaction(() => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Pessoal', priority INTEGER NOT NULL DEFAULT 2,
        due TEXT, done INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        user_id INTEGER REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS task_types (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL COLLATE NOCASE, color TEXT NOT NULL,
        UNIQUE(user_id, name)
      );
    `);
    const typeColumns = new Set(db.prepare("PRAGMA table_info(task_types)").all().map(column => column.name));
    if (!typeColumns.has("icon")) db.exec("ALTER TABLE task_types ADD COLUMN icon TEXT");
    const columns = new Set(db.prepare("PRAGMA table_info(tasks)").all().map(column => column.name));
    if (!columns.has("user_id")) db.exec("ALTER TABLE tasks ADD COLUMN user_id INTEGER REFERENCES users(id)");
    if (!columns.has("due_time")) db.exec("ALTER TABLE tasks ADD COLUMN due_time TEXT");
    if (!columns.has("type_id")) db.exec("ALTER TABLE tasks ADD COLUMN type_id INTEGER REFERENCES task_types(id)");
    if (!columns.has("recurrence")) db.exec("ALTER TABLE tasks ADD COLUMN recurrence TEXT NOT NULL DEFAULT 'none'");
    if (!columns.has("recurrence_until")) db.exec("ALTER TABLE tasks ADD COLUMN recurrence_until TEXT");
    if (!columns.has("recurrence_days")) db.exec("ALTER TABLE tasks ADD COLUMN recurrence_days TEXT NOT NULL DEFAULT '[]'");
    if (!columns.has("notify_time")) db.exec("ALTER TABLE tasks ADD COLUMN notify_time TEXT");
    if (!columns.has("tracks_overdue")) db.exec("ALTER TABLE tasks ADD COLUMN tracks_overdue INTEGER NOT NULL DEFAULT 1");
    // Regulares deixaram de ter horário de conclusão: o antigo vira horário de notificação.
    db.exec("UPDATE tasks SET notify_time = due_time, due_time = NULL WHERE recurrence <> 'none' AND due_time IS NOT NULL");
    db.exec(`CREATE TABLE IF NOT EXISTS task_occurrences (
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      due TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      skipped INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (task_id, due)
    )`);
    db.exec("CREATE INDEX IF NOT EXISTS tasks_user_id ON tasks(user_id)");
    for (const user of db.prepare("SELECT id FROM users").all()) seedTaskTypes(db, user.id);
  })();
  return db;
}
