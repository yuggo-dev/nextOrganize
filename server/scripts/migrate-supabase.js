import Database from 'better-sqlite3';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { supabaseDatabaseUrl } from './supabase-env.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
if (existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));
const tables = {
  users: ['id', 'name', 'email', 'password_hash'],
  task_types: ['id', 'user_id', 'name', 'color', 'icon'],
  tasks: ['id', 'title', 'category', 'priority', 'due', 'done', 'created_at', 'user_id', 'due_time', 'type_id', 'recurrence', 'recurrence_until', 'recurrence_days'],
  task_occurrences: ['task_id', 'due', 'done', 'skipped'],
};
const dryRun = process.argv.includes('--dry-run');
const source = path.resolve(root, process.env.DB_PATH || 'server/tarefas.db');
let sqlite;
let client;
try {
  sqlite = new Database(source, { readonly: true, fileMustExist: true });
  sqlite.exec('BEGIN');
  if (sqlite.pragma('integrity_check', { simple: true }) !== 'ok' || sqlite.pragma('foreign_key_check').length) {
    throw new Error('O SQLite falhou na verificação de integridade. Nenhum dado foi importado.');
  }
  for (const [table, columns] of Object.entries(tables)) {
    const existing = new Set(sqlite.prepare(`PRAGMA table_info(${table})`).all().map(column => column.name));
    if (columns.some(column => !existing.has(column))) throw new Error(`SQLite desatualizado: ${table}. Inicie a aplicação atual antes de migrar.`);
  }
  const counts = Object.fromEntries(Object.keys(tables).map(table => [table, sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get().n]));
  console.log('Registros a importar:', counts);
  if (!dryRun) {
    const url = supabaseDatabaseUrl();
    const { Client } = await import('pg');
    const connection = new URL(url);
    for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) connection.searchParams.delete(key);
    client = new Client({
      connectionString: connection.toString(), connectionTimeoutMillis: 15000,
      ssl: { rejectUnauthorized: true, ...(process.env.PG_CA_PATH ? { ca: readFileSync(path.resolve(root, process.env.PG_CA_PATH), 'utf8') } : {}) },
    });
    await client.connect();
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(178492681)");
    for (const migration of readdirSync(path.join(root, 'supabase/migrations')).filter(file => file.endsWith('.sql')).sort()) {
      await client.query(readFileSync(path.join(root, 'supabase/migrations', migration), 'utf8'));
    }
    await client.query(`LOCK TABLE ${[...Object.keys(tables), 'sessions'].map(table => `tarefas.${table}`).join(', ')} IN ACCESS EXCLUSIVE MODE`);
    for (const table of [...Object.keys(tables), 'sessions']) {
      const { rows } = await client.query(`SELECT count(*) AS n FROM tarefas.${table}`);
      if (Number(rows[0].n)) throw new Error('O destino já contém dados. Importação cancelada sem sobrescrever registros.');
    }
    for (const [table, columns] of Object.entries(tables)) {
      const sql = `INSERT INTO tarefas.${table} (${columns.join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})`;
      for (const row of sqlite.prepare(`SELECT ${columns.join(', ')} FROM ${table}`).iterate()) {
        await client.query(sql, columns.map(column => row[column]));
      }
      const { rows } = await client.query(`SELECT count(*) AS n FROM tarefas.${table}`);
      if (Number(rows[0].n) !== counts[table]) throw new Error(`Contagem divergente: ${table}.`);
    }
    for (const table of ['users', 'task_types', 'tasks']) {
      await client.query(`SELECT setval(pg_get_serial_sequence('tarefas.${table}', 'id'), COALESCE(max(id), 1), max(id) IS NOT NULL) FROM tarefas.${table}`);
    }
    await client.query('COMMIT');
    console.log('Importação concluída e contagens conferidas. Sessões antigas não foram importadas; faça login novamente.');
  } else {
    console.log('Simulação concluída. Nenhuma conexão com o Supabase e nenhuma escrita no SQLite.');
  }
} catch (error) {
  if (client) await client.query('ROLLBACK').catch(() => {});
  // Never print connection strings, credentials or query parameters.
  console.error(`Migração interrompida (${error.code || 'validação'}).`, error.code ? 'Confira conexão, certificado e estrutura do banco.' : error.message);
  process.exitCode = 1;
} finally {
  if (client) await client.end();
  if (sqlite?.open) sqlite.close();
}
