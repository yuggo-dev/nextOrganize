export function isoDate(date) {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isOverdue(task, now) {
  if (task.done || !task.due) return false;
  const today = isoDate(now);
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return task.due < today || (task.due === today && !!task.due_time && task.due_time < time);
}

export function daysFromToday(date, now) {
  const [year, month, day] = date.split("-").map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
}

export function sortTasks(tasks, now) {
  const today = isoDate(now);
  const rank = task => {
    if (task.done) return 5;
    if (isOverdue(task, now)) return 4;
    if (task.due === today) return 0;
    if (task.due) return 1;
    return 2;
  };
  return [...tasks].sort((a, b) => rank(a) - rank(b) ||
    (a.due || "9999").localeCompare(b.due || "9999") ||
    (a.due_time || "24:00").localeCompare(b.due_time || "24:00") ||
    a.priority - b.priority || Number(b.source_id || b.id) - Number(a.source_id || a.id));
}

export function calendarDays(month) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}
