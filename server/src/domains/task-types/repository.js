const defaults = [
  ["Trabalho", "#6366f1"],
  ["Físico", "#14b8a6"],
  ["Alimentação", "#f59e0b"],
  ["Pessoal", "#ec4899"],
  ["Estudos", "#3b82f6"],
];

export function seedTaskTypes(db, userId) {
  const insert = db.prepare("INSERT OR IGNORE INTO task_types (user_id, name, color) VALUES (?, ?, ?)");
  for (const [name, color] of defaults) insert.run(userId, name, color);
  const categories = db.prepare("SELECT DISTINCT category FROM tasks WHERE user_id = ?").all(userId);
  for (const { category } of categories) insert.run(userId, category, "#64748b");
  db.prepare(`UPDATE tasks SET type_id = (
    SELECT id FROM task_types WHERE task_types.user_id = tasks.user_id AND name = tasks.category COLLATE NOCASE
  ) WHERE user_id = ? AND type_id IS NULL`).run(userId);
}

export function taskTypeRepository(db) {
  return {
    list: userId => db.prepare("SELECT id, name, color FROM task_types WHERE user_id = ? ORDER BY id").all(userId),
    get: (id, userId) => db.prepare("SELECT id, name, color FROM task_types WHERE id = ? AND user_id = ?").get(id, userId),
    findByName: (name, userId) => db.prepare("SELECT id, name, color FROM task_types WHERE name = ? COLLATE NOCASE AND user_id = ?").get(name, userId),
    create(name, color, userId) {
      const result = db.prepare("INSERT INTO task_types (name, color, user_id) VALUES (?, ?, ?)").run(name, color, userId);
      return this.get(result.lastInsertRowid, userId);
    },
  };
}
