export function isoDate(date) {
  return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export const isRegular = task => task.recurrence === "daily" || task.recurrence === "weekly";

// Cada atividade escolhe se conta atraso (tracks_overdue, padrão sim). Sem
// contar, nunca fica atrasada: quando o dia passa, vira só "não feita".
// Pontual: atrasada depois do horário de conclusão (se houver) ou quando a data passa.
// Regular: nunca durante o próprio dia; depois dele, se conta atraso.
export function isOverdue(task, now) {
  if (task.done || !task.due || task.tracks_overdue === false) return false;
  const today = isoDate(now);
  if (isRegular(task)) return task.due < today;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return task.due < today || (task.due === today && !!task.due_time && task.due_time < time);
}

// Atividade (pontual ou regular) que não conta atraso e cujo dia passou sem
// conclusão: fica só "não feita".
export function isMissed(task, now) {
  return task.tracks_overdue === false && !task.done && !!task.due && task.due < isoDate(now);
}

// Ainda pede ação: aberta e não encerrada como "não feita".
export const isPending = (task, now) => !task.done && !isMissed(task, now);

export function daysFromToday(date, now) {
  const [year, month, day] = date.split("-").map(Number);
  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
}

// Rótulo curto da distância entre uma data e hoje: Hoje, Amanhã, Ontem,
// "Em 3 dias" ou "Há 3 dias".
export function relativeDayLabel(date, now) {
  const days = daysFromToday(date, now);
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  if (days === -1) return "Ontem";
  return days > 0 ? `Em ${days} dias` : `Há ${-days} dias`;
}

export function sortTasks(tasks, now) {
  const today = isoDate(now);
  const rank = task => {
    if (task.done) return 6;
    if (isMissed(task, now)) return 5;
    if (isOverdue(task, now)) return 4;
    if (task.due === today) return 0;
    if (task.due) return 1;
    return 2;
  };
  return [...tasks].sort((a, b) => rank(a) - rank(b) ||
    (a.due || "9999").localeCompare(b.due || "9999") ||
    (a.due_time || a.notify_time || "24:00").localeCompare(b.due_time || b.notify_time || "24:00") ||
    a.priority - b.priority || Number(b.source_id || b.id) - Number(a.source_id || a.id));
}

export function calendarDays(month) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}
