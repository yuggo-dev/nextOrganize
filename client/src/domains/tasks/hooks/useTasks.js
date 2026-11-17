import { useEffect, useState } from "react";
import { taskApi } from "../api.js";
import { taskTypeApi } from "../../task-types/api.js";

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([taskApi.list(), taskTypeApi.list()])
      .then(([tasks, types]) => { if (active) { setTasks(tasks); setTypes(types); } })
      .catch(error => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function replaceTask(updated, date) {
    setTasks(current => current.map(task => {
      if (task.id !== updated.id) return task;
      if (!date) return updated;
      const occurrence = updated.occurrences.find(day => day.due === date);
      return { ...updated, occurrences: [...(task.occurrences || []).filter(day => day.due !== date), occurrence] };
    }));
  }

  return {
    tasks, types, loading, error, setError,
    async addTask(form) {
      const task = await taskApi.create(form);
      setTasks(current => [task, ...current]);
      return task;
    },
    async addType(form) {
      const type = await taskTypeApi.create(form);
      setTypes(current => [...current, type]);
      return type;
    },
    async toggleTask(task) {
      const date = task.source_id ? task.due : undefined;
      const updated = await taskApi.update(task.source_id || task.id, { done: !task.done, occurrence_date: date });
      replaceTask(updated, date);
    },
    async deleteTask(task) {
      if (task.source_id) {
        const updated = await taskApi.remove(task.source_id, task.due);
        replaceTask(updated, task.due);
        return;
      }
      await taskApi.remove(task.id);
      setTasks(current => current.filter(item => item.id !== task.id));
    },
    async deleteSeries(task) {
      await taskApi.remove(task.source_id);
      setTasks(current => current.filter(item => item.id !== task.source_id));
    },
  };
}
