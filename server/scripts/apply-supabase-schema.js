import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPostgres } from '../src/infrastructure/postgres.js';
const root = fileURLToPath(new URL('../../', import.meta.url));
if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));
let db;
try {
  if (!process.env.DATABASE_URL) throw new Error('missing configuration');
  db = await openPostgres(process.env.DATABASE_URL, {
    verifySchema: false,
    caPath: process.env.PG_CA_PATH && path.resolve(root, process.env.PG_CA_PATH),
  });
  await db.transaction(async () => {
    await db.query('SELECT pg_advisory_xact_lock(178492681)');
    await db.query(readFileSync(path.join(root, 'supabase/migrations/202611170001_initial.sql'), 'utf8'));
  })();
  console.log('Estrutura PostgreSQL aplicada. Dados existentes preservados.');
} catch (error) {
  console.error('Não foi possível preparar o banco. Confira DATABASE_URL, TLS e permissões.', error.code || 'configuração');
  process.exitCode = 1;
} finally { if (db) await db.close(); }
