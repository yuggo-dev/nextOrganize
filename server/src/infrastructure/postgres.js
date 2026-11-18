import { Pool } from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';
import { readFileSync } from 'node:fs';

/** @param {string} connectionString
 * @param {{caPath?: string, ca?: string, ssl?: boolean, verifySchema?: boolean, max?: number}} options
 */
export async function openPostgres(connectionString, { caPath, ca, ssl = true, verifySchema = true, max = 10 } = {}) {
  const url = new URL(connectionString);
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) url.searchParams.delete(key);
  const pool = new Pool({ connectionString: url.toString(), max,
    connectionTimeoutMillis: 15000, idleTimeoutMillis: 30000,
    ssl: ssl ? { rejectUnauthorized: true, ...(ca ? {ca} : caPath ? { ca: readFileSync(caPath, 'utf8') } : {}) } : false });
  pool.on("error", error => console.error("Conexão PostgreSQL ociosa interrompida.", error.code || "conexão"));
  const db = postgresDatabase(pool);
  try {
    if (verifySchema) await pool.query('SELECT id FROM tarefas.users LIMIT 0');
    else await pool.query('SELECT 1');
  } catch (error) { await pool.end(); throw error; }
  return db;
}

export function postgresDatabase(pool) {
  const context = new AsyncLocalStorage();
  const db = {
    dialect: 'postgres',
    query: (sql, values) => (context.getStore() || pool).query(sql, values),
    transaction: callback => async (...args) => {
      if (context.getStore()) return callback(...args);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await context.run(client, () => callback(...args));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    },
    close: () => pool.end(),
  };
  return db;
}
