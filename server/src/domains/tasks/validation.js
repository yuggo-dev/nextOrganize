import { httpError } from "../../shared/http.js";

export function validDate(date) {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}

export function validateOccurrence(task, date) {
  if (task.recurrence !== "daily" || !validDate(date) || date < task.due ||
    (task.recurrence_until && date > task.recurrence_until)) {
    throw httpError(400, "Escolha um dia válido para esta tarefa diária.");
  }
}
