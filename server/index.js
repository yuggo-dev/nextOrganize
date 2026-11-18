import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './src/infrastructure/database.js';
import { openPostgres } from './src/infrastructure/postgres.js';
import { createApp } from './src/app.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, '..');
// Os testes de integração usam bancos temporários e não devem carregar secrets locais.
if (process.env.NODE_ENV !== 'test' && existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));
try {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('Configure DATABASE_URL para iniciar em produção.');
  }
  const db = process.env.DATABASE_URL
    ? await openPostgres(process.env.DATABASE_URL, { caPath: process.env.PG_CA_PATH && path.resolve(root, process.env.PG_CA_PATH) })
    : openDatabase(process.env.DB_PATH ? path.resolve(root, process.env.DB_PATH) : path.join(directory, 'tarefas.db'));
  const app = createApp(db, path.join(root, 'client/dist'));
  const server = app.listen(process.env.PORT || 3001, '0.0.0.0', () => {
    console.log(`Servidor em http://localhost:${server.address().port}`);
  });
  for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {
    server.close(async () => { await db.close(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
} catch (error) {
  console.error('Falha ao iniciar a API. Confira DATABASE_URL, TLS e a migração do banco.', error.code || 'configuração');
  process.exitCode = 1;
}
