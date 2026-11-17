import { call } from "../../shared/http/client.js";

export const taskTypeApi = {
  list: () => call("/task-types"),
  create: type => call("/task-types", { method: "POST", body: type }),
};
