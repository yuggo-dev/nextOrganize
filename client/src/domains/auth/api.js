import { call } from "../../shared/http/client.js";

export const authApi = {
  me: () => call("/auth/me"),
  register: data => call("/auth/register", { method: "POST", body: data }),
  login: data => call("/auth/login", { method: "POST", body: data }),
  logout: () => call("/auth/logout", { method: "POST" }),
};
