import { Router } from "express";
import { taskService } from "./service.js";

export function taskRoutes(db) {
  const router = Router();
  const service = taskService(db);
  router.get("/", (req, res) => res.json(service.list(req.user.id)));
  router.post("/", (req, res) => res.status(201).json(service.create(req.body || {}, req.user.id)));
  router.patch("/:id", (req, res) => res.json(service.update(req.params.id, req.body || {}, req.user.id)));
  router.delete("/:id", (req, res) => {
    const updated = service.remove(req.params.id, req.user.id, req.query.date);
    if (updated) return res.json(updated);
    res.status(204).end();
  });
  return router;
}
