import { postgresAuthRepository } from "../../infrastructure/postgres-repositories.js";
import { seedTaskTypes } from "../task-types/repository.js";

export function authRepository(db) {
  if (db.dialect === "postgres") return postgresAuthRepository(db);
  return {
    findUser: email => db.prepare("SELECT * FROM users WHERE email = ?").get(email),
    createUser: db.transaction((name, email, passwordHash) => {
      const result = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(name, email, passwordHash);
      const id = Number(result.lastInsertRowid);
      seedTaskTypes(db, id);
      return { id, name, email };
    }),
    findSession: hash => db.prepare(`SELECT users.id, users.name, users.email FROM sessions
      JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?`).get(hash, Date.now()),
    createSession(hash, userId, expiresAt) {
      db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
      db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(hash, userId, expiresAt);
    },
    removeSession: hash => db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash),
  };
}
