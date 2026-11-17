const select = `SELECT tasks.*, COALESCE(task_types.name, tasks.category) AS category,
  COALESCE(task_types.color, '#64748b') AS category_color
  FROM tasks LEFT JOIN task_types ON task_types.id = tasks.type_id AND task_types.user_id = tasks.user_id`;
const serialize = ({ user_id, ...task }) => ({ ...task, done: !!task.done });

export function taskRepository(db) {
  const occurrences = db.prepare("SELECT due, done, skipped FROM task_occurrences WHERE task_id = ? ORDER BY due");
  const withHistory = task => {
    const result = serialize(task);
    if (task.recurrence === "daily") {
      result.occurrences = occurrences.all(task.id).map(row => ({ ...row, done: !!row.done, skipped: !!row.skipped }));
    }
    return result;
  };
  return {
    list: userId => db.prepare(`${select} WHERE tasks.user_id = ? ORDER BY tasks.id DESC`).all(userId).map(withHistory),
    get(id, userId) {
      const task = db.prepare(`${select} WHERE tasks.id = ? AND tasks.user_id = ?`).get(id, userId);
      return task && withHistory(task);
    },
    create(task, userId) {
      const result = db.prepare(`INSERT INTO tasks (title, category, priority, due, due_time, type_id, recurrence, recurrence_until, user_id)
        VALUES (@title, @category, @priority, @due, @due_time, @type_id, @recurrence, @recurrence_until, @userId)`).run({ ...task, userId });
      return this.get(result.lastInsertRowid, userId);
    },
    update(id, task, userId) {
      db.prepare(`UPDATE tasks SET title=@title, category=@category, priority=@priority, due=@due,
        due_time=@due_time, type_id=@type_id, done=@done, recurrence=@recurrence,
        recurrence_until=@recurrence_until WHERE id=@id AND user_id=@userId`)
        .run({ ...task, done: task.done ? 1 : 0, id, userId });
      return this.get(id, userId);
    },
    saveOccurrence(id, date, done, skipped, userId) {
      db.prepare(`INSERT INTO task_occurrences (task_id, due, done, skipped)
        SELECT id, @date, @done, @skipped FROM tasks WHERE id = @id AND user_id = @userId
        ON CONFLICT(task_id, due) DO UPDATE SET done=excluded.done, skipped=excluded.skipped`)
        .run({ id, date, done: done ? 1 : 0, skipped: skipped ? 1 : 0, userId });
      return this.get(id, userId);
    },
    remove: (id, userId) => db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, userId),
  };
}
