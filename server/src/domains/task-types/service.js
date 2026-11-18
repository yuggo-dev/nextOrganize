import { taskTypeRepository } from './repository.js';
import { httpError } from '../../shared/http.js';

export function taskTypeService(db) {
  const repository = taskTypeRepository(db);
  async function save(body, userId, id) {
    const {name,color} = body;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 60) throw httpError(400,'Informe um tipo de até 60 caracteres.');
    if (typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color)) throw httpError(400,'Escolha uma cor válida.');
    let icon = body.icon;
    if (icon !== undefined && icon !== null && (typeof icon !== 'string' || !/^(Fa|Gi)[A-Za-z0-9]{1,60}$/.test(icon))) throw httpError(400,'Escolha um ícone válido.');
    if (id !== undefined && icon === undefined) {
      const current = await repository.get(id,userId);
      if (!current) throw httpError(404,'Tipo não encontrado.');
      icon = current.icon;
    }
    try {
      const result = id === undefined
        ? await repository.create(name.trim(),color.toLowerCase(),userId,icon ?? null)
        : await repository.update(id,name.trim(),color.toLowerCase(),userId,icon ?? null);
      if (!result) throw httpError(404,'Tipo não encontrado.');
      return result;
    } catch (error) {
      if (['SQLITE_CONSTRAINT_UNIQUE','23505'].includes(error.code)) throw httpError(409,'Você já possui um tipo com esse nome.');
      throw error;
    }
  }
  return {list: userId=>repository.list(userId),create:(body,userId)=>save(body,userId),update:(id,body,userId)=>save(body,userId,id)};
}
