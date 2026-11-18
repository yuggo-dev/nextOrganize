import { call } from "../../shared/http/client.js";

export const taskTypeApi = {
  update: (id, type) => call(`/task-types/${id}`, { method: "PATCH", body: type }),
  list: () => call("/task-types"),
  create: type => call("/task-types", { method: "POST", body: type }),
};
