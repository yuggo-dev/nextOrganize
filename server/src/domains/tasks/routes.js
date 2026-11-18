import { asyncRoute } from "../../shared/http.js";
import { Router } from "express";
import { taskService } from "./service.js";

export function taskRoutes(db) {
  const router = Router();
  const service = taskService(db);
  router.get("/", asyncRoute(async (req, res) => res.json(await service.list(req.user.id))));
  router.post("/", asyncRoute(async (req, res) => res.status(201).json(await service.create(req.body || {}, req.user.id))));
  router.patch("/:id", asyncRoute(async (req, res) => res.json(await service.update(req.params.id, req.body || {}, req.user.id))));
  router.delete("/:id", asyncRoute(async (req, res) => {
    const updated = await service.remove(req.params.id, req.user.id, req.query.date);
    if (updated) return res.json(updated);
    res.status(204).end();
  }));
  return router;
}
