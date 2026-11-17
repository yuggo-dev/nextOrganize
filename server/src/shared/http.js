export const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Entre na sua conta para acessar as tarefas." });
  next();
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status >= 400 && error.status < 500 ? error.status : 500;
  if (status === 500) console.error(error);
  res.status(status).json({ error: status === 500 ? "Não foi possível concluir a operação." : error.message });
}
