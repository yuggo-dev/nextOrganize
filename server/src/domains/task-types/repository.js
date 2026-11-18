import { postgresTypeRepository } from "../../infrastructure/postgres-repositories.js";
const defaults = [
  ["Trabalho", "#6366f1"],
  ["Físico", "#14b8a6"],
  ["Alimentação", "#f59e0b"],
  ["Pessoal", "#ec4899"],
  ["Estudos", "#3b82f6"],
];

export function seedTaskTypes(db, userId) {
  const insert = db.prepare("INSERT OR IGNORE INTO task_types (user_id, name, color) VALUES (?, ?, ?)");
  if (!db.prepare("SELECT id FROM task_types WHERE user_id = ? LIMIT 1").get(userId)) {
    for (const [name, color] of defaults) insert.run(userId, name, color);
  }
  const categories = db.prepare("SELECT DISTINCT category FROM tasks WHERE user_id = ?").all(userId);
  for (const { category } of categories) insert.run(userId, category, "#64748b");
  db.prepare(`UPDATE tasks SET type_id = (
    SELECT id FROM task_types WHERE task_types.user_id = tasks.user_id AND name = tasks.category COLLATE NOCASE
  ) WHERE user_id = ? AND type_id IS NULL`).run(userId);
}

export function taskTypeRepository(db) {
  if (db.dialect === "postgres") return postgresTypeRepository(db);
  return {
    update: db.transaction((id, name, color, userId, icon) => {
      const result = db.prepare("UPDATE task_types SET name = ?, color = ?, icon = ? WHERE id = ? AND user_id = ?").run(name,color,icon ?? null,id,userId);
      if (!result.changes) return undefined;
      db.prepare("UPDATE tasks SET category = ? WHERE type_id = ? AND user_id = ?").run(name,id,userId);
      return { id, name, color, icon: icon ?? null };
    }),
    list: userId => db.prepare("SELECT id, name, color, icon FROM task_types WHERE user_id = ? ORDER BY id").all(userId),
    get: (id, userId) => db.prepare("SELECT id, name, color, icon FROM task_types WHERE id = ? AND user_id = ?").get(id, userId),
    findByName: (name, userId) => db.prepare("SELECT id, name, color, icon FROM task_types WHERE name = ? COLLATE NOCASE AND user_id = ?").get(name, userId),
    create(name, color, userId, icon = null) {
      const result = db.prepare("INSERT INTO task_types (name, color, user_id, icon) VALUES (?, ?, ?, ?)").run(name, color, userId, icon);
      return this.get(result.lastInsertRowid, userId);
    },
  };
}
