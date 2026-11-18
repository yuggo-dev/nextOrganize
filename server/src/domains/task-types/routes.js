import { Router } from "express";
import { taskTypeRepository } from "./repository.js";
import { httpError, asyncRoute } from "../../shared/http.js";

export function taskTypeRoutes(db) {
  const router = Router();
  const repository = taskTypeRepository(db);
  router.get("/", asyncRoute(async (req, res) => res.json(await repository.list(req.user.id))));
  router.post("/", asyncRoute(async (req, res) => {
    const { name, color } = req.body || {};
    if (typeof name !== "string" || !name.trim() || name.trim().length > 60) {
      throw httpError(400, "Informe um tipo de até 60 caracteres.");
    }
    if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)) {
      throw httpError(400, "Escolha uma cor válida.");
    }
    try {
      res.status(201).json(await repository.create(name.trim(), color.toLowerCase(), req.user.id));
    } catch (error) {
      if (["SQLITE_CONSTRAINT_UNIQUE", "23505"].includes(error.code)) throw httpError(409, "Você já possui um tipo com esse nome.");
      throw error;
    }
  }));
  return router;
}
