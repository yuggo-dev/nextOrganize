import { Buffer } from "node:buffer";
import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { authRepository } from "./repository.js";
import { httpError } from "../../shared/http.js";

const deriveKey = promisify(scrypt);
const dummySalt = randomBytes(16).toString("hex");
const dummyKey = randomBytes(64).toString("hex");
export const sessionAge = 7 * 24 * 60 * 60 * 1000;
export const tokenHash = token => createHash("sha256").update(token).digest("hex");

export function authService(db) {
  const repository = authRepository(db);
  const passwordKey = db.deriveKey || deriveKey;
  return {
    async register({ name, email, password }) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
        throw httpError(400, "Informe um nome de até 100 caracteres.");
      }
      if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw httpError(400, "Informe um e-mail válido.");
      }
      if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        throw httpError(400, "A senha deve ter entre 8 e 128 caracteres.");
      }
      const salt = randomBytes(16).toString("hex");
      const key = await passwordKey(password, salt, 64);
      try {
        return await repository.createUser(name.trim(), email.trim().toLowerCase(), `${salt}:${key.toString("hex")}`);
      } catch (error) {
        if (["SQLITE_CONSTRAINT_UNIQUE", "23505"].includes(error.code)) throw httpError(409, "Este e-mail já está cadastrado.");
        throw error;
      }
    },
    async login({ email, password }) {
      if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 128) {
        throw httpError(400, "Informe e-mail e senha válidos.");
      }
      const user = await repository.findUser(email.trim().toLowerCase());
      const [salt, storedKey] = user ? user.password_hash.split(":") : [dummySalt, dummyKey];
      const key = await passwordKey(password, salt, 64);
      if (!timingSafeEqual(key, Buffer.from(storedKey, "hex")) || !user) {
        throw httpError(401, "E-mail ou senha incorretos.");
      }
      return { id: user.id, name: user.name, email: user.email };
    },
    async createSession(userId) {
      const token = randomBytes(32).toString("hex");
      await repository.createSession(tokenHash(token), userId, Date.now() + sessionAge);
      return token;
    },
    findSession: hash => repository.findSession(hash),
    removeSession: hash => repository.removeSession(hash),
  };
}
