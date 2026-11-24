import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPostgres } from '../src/infrastructure/postgres.js';
import { supabaseDatabaseUrl } from './supabase-env.js';
const root = fileURLToPath(new URL('../../', import.meta.url));
if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));
let db;
try {
  db = await openPostgres(supabaseDatabaseUrl(), {
    verifySchema: false,
    caPath: process.env.PG_CA_PATH && path.resolve(root, process.env.PG_CA_PATH),
  });
  await db.transaction(async () => {
    await db.query('SELECT pg_advisory_xact_lock(178492681)');
    for (const migration of readdirSync(path.join(root, 'supabase/migrations')).filter(file => file.endsWith('.sql')).sort()) {
      await db.query(readFileSync(path.join(root, 'supabase/migrations', migration), 'utf8'));
    }
  })();
  console.log('Estrutura PostgreSQL aplicada. Dados existentes preservados.');
} catch (error) {
  console.error(error.hint || `Não foi possível preparar o banco. Confira SUPABASE_DATABASE_URL, TLS e permissões. (${error.code || 'configuração'})`);
  process.exitCode = 1;
} finally { if (db) await db.close(); }
