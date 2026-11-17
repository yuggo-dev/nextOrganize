import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "./src/infrastructure/database.js";
import { createApp } from "./src/app.js";

const directory = path.dirname(fileURLToPath(import.meta.url));
const db = openDatabase(process.env.DB_PATH || path.join(directory, "tarefas.db"));
const app = createApp(db, path.join(directory, "../client/dist"));
const server = app.listen(process.env.PORT || 3001, () => {
  console.log(`Servidor em http://localhost:${server.address().port}`);
});
