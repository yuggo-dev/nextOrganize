import { taskRepository } from "./repository.js";
import { taskTypeRepository } from "../task-types/repository.js";
import { httpError } from "../../shared/http.js";
import { validateOccurrence } from "./validation.js";
import { validateTask } from "./service.js";

export function postgresTaskService(db) {
  const repository = taskRepository(db);
  const types = taskTypeRepository(db);

  async function resolveType(body, current, userId) {
    if (body.type_id !== undefined) {
      if (!Number.isSafeInteger(Number(body.type_id)) || Number(body.type_id) < 1) {
        throw httpError(400, "Escolha um tipo da sua conta.");
      }
      const type = await types.get(Number(body.type_id), userId);
      if (!type) throw httpError(400, "Escolha um tipo da sua conta.");
      return type;
    }
    if (body.category === undefined && current?.type_id) return types.get(current.type_id, userId);
    const name = String(body.category ?? current?.category ?? "Pessoal").trim();
    if (!name || name.length > 60) throw httpError(400, "Informe um tipo de até 60 caracteres.");
    return await types.findByName(name, userId) || types.create(name, "#64748b", userId);
  }

  return {
    list: userId => repository.list(userId),
    create: db.transaction(async (body, userId) => {
      const task = validateTask(body);
      const type = await resolveType(body, null, userId);
      return repository.create({ ...task, category: type.name, type_id: type.id }, userId);
    }),
    update: db.transaction(async (id, body, userId) => {
      const current = await repository.get(id, userId);
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
      const type = await resolveType(body, current, userId);
      const updated = await repository.update(id, { ...task, category: type.name, type_id: type.id }, userId);
      if (current.recurrence === "none" && task.recurrence !== "none" && current.done) {
        validateOccurrence({ ...task }, task.due);
        return repository.saveOccurrence(id, task.due, true, false, userId);
      }
      return updated;
    }),
    async remove(id, userId, date) {
      if (date !== undefined) {
        const current = await repository.get(id, userId);
        if (!current) throw httpError(404, "Tarefa não encontrada.");
        validateOccurrence(current, date);
        return repository.saveOccurrence(id, date, false, true, userId);
      }
      await repository.remove(id, userId);
      return null;
    },
  };
}
