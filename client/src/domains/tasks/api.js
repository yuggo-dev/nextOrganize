import { call } from "../../shared/http/client.js";

export const taskApi = {
  list: () => call("/tasks"),
  create: task => call("/tasks", { method: "POST", body: task }),
  update: (id, patch) => call(`/tasks/${id}`, { method: "PATCH", body: patch }),
  remove: (id, date) => call(`/tasks/${id}${date ? `?date=${encodeURIComponent(date)}` : ""}`, { method: "DELETE" }),
};
