import express from "express";
import fs from "node:fs";
import path from "node:path";
import { authRoutes, sessionMiddleware } from "./domains/auth/routes.js";
import { taskRoutes } from "./domains/tasks/routes.js";
import { taskTypeRoutes } from "./domains/task-types/routes.js";
import { errorHandler, requireUser } from "./shared/http.js";

export function createApp(db, dist) {
  const app = express();
  app.use(express.json({ limit: "16kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("X-Requested-With") !== "tarefas") {
      return res.status(403).json({ error: "Requisição inválida. Recarregue a página." });
    }
    next();
  });
  app.use("/api", sessionMiddleware(db));
  app.use("/api/auth", authRoutes(db));
  app.use("/api/tasks", requireUser, taskRoutes(db));
  app.use("/api/task-types", requireUser, taskTypeRoutes(db));
  app.use("/api", (_req, res) => res.status(404).json({ error: "Rota não encontrada." }));
  app.use(errorHandler);
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
  }
  return app;
}
