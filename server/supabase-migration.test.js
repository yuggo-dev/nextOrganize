import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { openDatabase } from './src/infrastructure/database.js';

test('Supabase dry run validates records without modifying the source or connecting', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'supabase-check-'));
  const filename = path.join(directory, 'source.db');
  try {
    const db = openDatabase(filename);
    db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run('Teste', 'test@example.test', 'preserved-hash');
    db.prepare("INSERT INTO tasks (title, user_id, recurrence, due) VALUES ('Diária', 1, 'daily', '2026-11-17')").run();
    db.prepare("INSERT INTO task_occurrences (task_id, due, done) VALUES (1, '2026-11-17', 1)").run();
    db.close();
    const before = await readFile(filename);
    const result = spawnSync(process.execPath, [new URL('./scripts/migrate-supabase.js', import.meta.url).pathname, '--dry-run'], {
      env: { ...process.env, DB_PATH: filename, SUPABASE_DATABASE_URL: 'invalid-connection-must-not-be-used' }, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /task_occurrences: 1/);
    assert.match(result.stdout, /Simulação concluída/);
    assert.deepEqual(await readFile(filename), before);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
