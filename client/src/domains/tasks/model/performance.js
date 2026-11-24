import { daysFromToday, isMissed, isoDate, isOverdue } from "./schedule.js";
import { expandRecurringTasks, recurringStart } from "./recurrence.js";

export function buildPerformance(tasks, now, period = "all") {
  const month = isoDate(now).slice(0, 7);
  const today = isoDate(now);
  const history = expandRecurringTasks(tasks, recurringStart(tasks, today), today, now);
  const filtered = history.filter(task => {
    if (period === "month") return task.due?.slice(0, 7) === month;
    if (period === "week") {
      if (!task.due) return false;
      const days = daysFromToday(task.due, now);
      return days >= -6 && days <= 0;
    }
    return true;
  });
  const total = filtered.length;
  const completed = filtered.filter(task => task.done).length;
  const overdue = filtered.filter(task => isOverdue(task, now)).length;
  // Regulares que não contam atraso e passaram do dia: não estão em aberto nem atrasadas.
  const missed = filtered.filter(task => isMissed(task, now)).length;
  const open = total - completed - missed;
  const byType = new Map();

  for (const task of filtered) {
    const key = task.type_id ?? `category:${task.category}`;
    if (!byType.has(key)) {
      byType.set(key, { id: key, name: task.category, icon: task.category_icon || null, color: task.category_color || "#64748b", total: 0, completed: 0 });
    }
    const group = byType.get(key);
    group.total += 1;
    group.completed += task.done ? 1 : 0;
  }

  const priorities = [
    { id: 1, name: "Alta" },
    { id: 2, name: "Média" },
    { id: 3, name: "Baixa" },
  ];
  if (filtered.some(task => ![1, 2, 3].includes(Number(task.priority)))) priorities.push({ id: "other", name: "Outras" });
  const priorityRows = priorities.map(priority => {
    const entries = filtered.filter(task => priority.id === "other"
      ? ![1, 2, 3].includes(Number(task.priority))
      : Number(task.priority) === priority.id);
    return { ...priority, total: entries.length, completed: entries.filter(task => task.done).length };
  });

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + index);
    const due = isoDate(date);
    const entries = filtered.filter(task => task.due === due);
    return { date, due, total: entries.length, completed: entries.filter(task => task.done).length };
  });

  return {
    total, completed, overdue, open, missed,
    scheduled: open - overdue,
    completionRate: total ? Math.round(completed / total * 100) : 0,
    types: [...byType.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR")),
    priorities: priorityRows,
    days,
  };
}
