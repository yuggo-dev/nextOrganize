// Um marcador por tipo; só concluído quando todas as atividades do grupo terminaram.
export function groupCalendarTypes(tasks) {
  const groups = new Map();
  for (const task of tasks) {
    const key = task.type_id ?? `category:${task.category || 'Sem tipo'}`;
    if (!groups.has(key)) groups.set(key, {
      id: key, name: task.category || 'Sem tipo', icon: task.category_icon,
      color: task.category_color || '#64748b', tasks: [], done: true, pending: 0,
    });
    const group = groups.get(key);
    group.tasks.push(task);
    group.done = group.done && !!task.done;
    if (!task.done) group.pending += 1;
  }
  return [...groups.values()].sort((a, b) => b.pending - a.pending || a.name.localeCompare(b.name, 'pt-BR'));
}
