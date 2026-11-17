import { Router } from "express";
import { authService, sessionAge, tokenHash } from "./service.js";
import { asyncRoute } from "../../shared/http.js";

const cookieOptions = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" };

export function sessionMiddleware(db) {
  const service = authService(db);
  return (req, _res, next) => {
    const cookie = (req.headers.cookie || "").split(";").map(part => part.trim()).find(part => part.startsWith("session="));
    req.sessionHash = tokenHash(cookie?.slice("session=".length) || "");
    req.user = service.findSession(req.sessionHash);
    next();
  };
}

export function authRoutes(db) {
  const router = Router();
  const service = authService(db);
  const attempts = new Map();
  function limitAuth(req, res, next) {
    const now = Date.now();
    for (const [ip, entry] of attempts) {
      if (entry.until <= now) attempts.delete(ip);
    }
    const entry = attempts.get(req.ip) || { count: 0, until: now + 15 * 60 * 1000 };
    if (entry.count >= 30 || (!attempts.has(req.ip) && attempts.size >= 1000)) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((entry.until - now) / 1000))));
      return res.status(429).json({ error: "Muitas tentativas. Tente novamente em alguns minutos." });
    }
    entry.count += 1;
    attempts.set(req.ip, entry);
    next();
  }

  function signIn(req, res, user, status) {
    service.removeSession(req.sessionHash);
    res.cookie("session", service.createSession(user.id), { ...cookieOptions, maxAge: sessionAge });
    res.status(status).json({ user });
  }

  router.get("/me", (req, res) => res.json({ user: req.user || null }));
  router.post("/register", limitAuth, asyncRoute(async (req, res) => {
    signIn(req, res, await service.register(req.body || {}), 201);
  }));
  router.post("/login", limitAuth, asyncRoute(async (req, res) => {
    signIn(req, res, await service.login(req.body || {}), 200);
  }));
  router.post("/logout", (req, res) => {
    service.removeSession(req.sessionHash);
    res.clearCookie("session", cookieOptions);
    res.status(204).end();
  });
  return router;
}
