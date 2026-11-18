import { Buffer } from 'node:buffer';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { createEdgeHandler } from '../_shared/backend/edge/handler.js';
import { openPostgres } from '../_shared/backend/infrastructure/postgres.js';

let connection: ReturnType<typeof openPostgres> | undefined;
const handler = createEdgeHandler({
  allowedOrigins: (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(origin => origin.trim()).filter(Boolean),
  getDatabase: async () => {
    if (!connection) {
      const url = Deno.env.get('TAREFAS_DATABASE_URL');
      if (!url) throw new Error('TAREFAS_DATABASE_URL ausente');
      connection = openPostgres(url, { max: 1, ca: Deno.env.get('TAREFAS_DATABASE_CA') }).then(db => Object.assign(db, {
        deriveKey: async (password: string, salt: string, length: number) => Buffer.from(
          await scryptAsync(password, salt, { N: 16384, r: 8, p: 1, dkLen: length }),
        ),
      })).catch(error => { connection = undefined; throw error; });
    }
    return connection;
  },
});
Deno.serve(handler);
