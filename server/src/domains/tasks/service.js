import { postgresTaskService } from "./postgres-service.js";
import { taskRepository } from "./repository.js";
import { taskTypeRepository } from "../task-types/repository.js";
import { httpError } from "../../shared/http.js";
import { validDate, validateOccurrence } from "./validation.js";

export function validateTask(body, current = {}) {
  const title = body.title === undefined ? current.title : String(body.title ?? "").trim().slice(0, 200);
  if (!title) throw httpError(400, "Título obrigatório.");
  const priority = Number(body.priority ?? current.priority ?? 2);
  if (![1, 2, 3].includes(priority)) throw httpError(400, "Escolha uma prioridade válida.");
  const due = body.due === undefined ? current.due || null : body.due || null;
  if (due && !validDate(due)) {
    throw httpError(400, "Informe uma data válida.");
  }
  const dueTime = body.due_time === undefined ? current.due_time || null : body.due_time || null;
  if (dueTime && (typeof dueTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(dueTime))) {
    throw httpError(400, "Informe um horário no formato HH:mm.");
  }
  if (!due && dueTime && body.due_time) throw httpError(400, "Defina a data para usar um horário.");
  const recurrence = body.recurrence ?? current.recurrence ?? "none";
  if (!["none", "daily", "weekly"].includes(recurrence)) throw httpError(400, "Escolha uma repetição válida.");
  const until = body.recurrence_until === undefined ? current.recurrence_until || null : body.recurrence_until || null;
  if (recurrence !== "none" && !due) throw httpError(400, "Informe a data inicial da tarefa periódica.");
  if (recurrence !== "none" && until && (!validDate(until) || until < due)) {
    throw httpError(400, "A data final deve ser igual ou posterior à data inicial.");
  }
  let days = [];
  if (recurrence === "weekly") {
    const input = body.recurrence_days === undefined ? current.recurrence_days : body.recurrence_days;
    if (!Array.isArray(input) || !input.length || input.some(day => !Number.isInteger(day) || day < 0 || day > 6)) {
      throw httpError(400, "Selecione pelo menos um dia da semana.");
    }
    days = [...new Set(input)].sort((a, b) => a - b);
    const first = new Date(`${due}T12:00:00Z`);
    const offset = Math.min(...days.map(day => (day - first.getUTCDay() + 7) % 7));
    first.setUTCDate(first.getUTCDate() + offset);
    if (until && first.toISOString().slice(0, 10) > until) throw httpError(400, "O período precisa incluir pelo menos um dos dias selecionados.");
  }
  return { title, priority, due, due_time: due ? dueTime : null,
    recurrence, recurrence_until: recurrence !== "none" ? until : null, recurrence_days: days,
    done: body.done === undefined ? !!current.done : !!body.done };
}

export function taskService(db) {
  if (db.dialect === "postgres") return postgresTaskService(db);
  const repository = taskRepository(db);
  const types = taskTypeRepository(db);

  function resolveType(body, current, userId) {
    if (body.type_id !== undefined) {
      if (!Number.isSafeInteger(Number(body.type_id)) || Number(body.type_id) < 1) {
        throw httpError(400, "Escolha um tipo da sua conta.");
      }
      const type = types.get(Number(body.type_id), userId);
      if (!type) throw httpError(400, "Escolha um tipo da sua conta.");
      return type;
    }
    if (body.category === undefined && current?.type_id) return types.get(current.type_id, userId);
    const name = String(body.category ?? current?.category ?? "Pessoal").trim();
    if (!name || name.length > 60) throw httpError(400, "Informe um tipo de até 60 caracteres.");
    return types.findByName(name, userId) || types.create(name, "#64748b", userId);
  }

  return {
    list: userId => repository.list(userId),
    create: db.transaction((body, userId) => {
      const task = validateTask(body);
      const type = resolveType(body, null, userId);
      return repository.create({ ...task, category: type.name, type_id: type.id }, userId);
    }),
    update: db.transaction((id, body, userId) => {
      const current = repository.get(id, userId);
      if (!current) throw httpError(404, "Tarefa não encontrada.");
      if (body.occurrence_date !== undefined) {
        validateOccurrence(current, body.occurrence_date);
        if (typeof body.done !== "boolean") throw httpError(400, "Informe a conclusão deste dia.");
        return repository.saveOccurrence(id, body.occurrence_date, body.done, false, userId);
      }
      if (current.recurrence !== "none" && body.done !== undefined) {
        throw httpError(400, "Informe o dia de conclusão da tarefa periódica.");
      }
      const task = validateTask(body, current);
      const type = resolveType(body, current, userId);
      const updated = repository.update(id, { ...task, category: type.name, type_id: type.id }, userId);
      if (current.recurrence === "none" && task.recurrence !== "none" && current.done) {
        validateOccurrence({ ...task }, task.due);
        return repository.saveOccurrence(id, task.due, true, false, userId);
      }
      return updated;
    }),
    remove(id, userId, date) {
      if (date !== undefined) {
        const current = repository.get(id, userId);
        if (!current) throw httpError(404, "Tarefa não encontrada.");
        validateOccurrence(current, date);
        return repository.saveOccurrence(id, date, false, true, userId);
      }
      repository.remove(id, userId);
      return null;
    },
  };
}
