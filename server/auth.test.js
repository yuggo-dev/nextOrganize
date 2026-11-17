import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const serverPath = fileURLToPath(new URL('./index.js', import.meta.url));

test('accounts isolate tasks, migrate legacy data and persist revocable sessions', { timeout: 30000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'tarefas-auth-'));
  const databasePath = path.join(directory, 'test.db');
  const legacy = new Database(databasePath);
  legacy.exec(`CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Pessoal', priority INTEGER NOT NULL DEFAULT 2,
    due TEXT, done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  ); INSERT INTO tasks (title) VALUES ('Tarefa antiga');`);
  legacy.close();
  let child;
  let base;
  const stop = async () => {
    if (!child || child.exitCode !== null) return;
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  };
  const start = async () => {
    child = spawn(process.execPath, [serverPath], {
      env: { ...process.env, PORT: '0', DB_PATH: databasePath, NODE_ENV: 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const output = await Promise.race([
      once(child.stdout, 'data').then(([data]) => data.toString()),
      once(child, 'exit').then(([code]) => { throw new Error('Server exited: ' + code); }),
    ]);
    base = output.match(/http:\/\/localhost:\d+/)[0];
  };
  const call = async (route, { method = 'GET', body, cookie, csrf = true } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (csrf) headers['X-Requested-With'] = 'tarefas';
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(base + '/api' + route, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      body: response.status === 204 ? null : await response.json(),
      cookie: response.headers.get('set-cookie')?.split(';')[0],
      setCookie: response.headers.get('set-cookie'),
    };
  };
  try {
    await start();
    assert.equal((await call('/tasks')).status, 401);
    assert.equal((await call('/auth/me')).body.user, null);
    const alice = { name: 'Alice', email: 'ALICE@example.com', password: 'senha-segura-123' };
    assert.equal((await call('/auth/register', { method: 'POST', body: alice, csrf: false })).status, 403);
    assert.equal((await call('/auth/register', { method: 'POST', body: { ...alice, password: 'curta' } })).status, 400);
    const accountA = await call('/auth/register', { method: 'POST', body: alice });
    assert.equal(accountA.status, 201);
    assert.equal(accountA.body.user.email, 'alice@example.com');
    assert.match(accountA.setCookie, /HttpOnly/);
    assert.match(accountA.setCookie, /SameSite=Lax/);
    assert.equal((await call('/auth/register', { method: 'POST', body: alice })).status, 409);
    assert.deepEqual((await call('/tasks', { cookie: accountA.cookie })).body, []);
    assert.equal((await call('/task-types')).status, 401);
    const typesA = await call('/task-types', { cookie: accountA.cookie });
    assert.ok(typesA.body.some(type => type.name === 'Trabalho'));
    const customType = await call('/task-types', { method: 'POST', cookie: accountA.cookie, body: { name: 'Leitura', color: '#A855F7' } });
    assert.equal(customType.status, 201);
    assert.equal(customType.body.color, '#a855f7');
    assert.equal((await call('/task-types', { method: 'POST', cookie: accountA.cookie, body: { name: 'leitura', color: '#a855f7' } })).status, 409);
    assert.equal((await call('/task-types', { method: 'POST', cookie: accountA.cookie, body: { name: 'Inválida', color: 'red' } })).status, 400);
    const taskA = await call('/tasks', { method: 'POST', cookie: accountA.cookie,
      body: { title: 'Privada da Alice', type_id: customType.body.id, due: '2026-11-20', due_time: '14:30' } });
    assert.equal(taskA.status, 201);
    assert.equal(taskA.body.category, 'Leitura');
    assert.equal(taskA.body.category_color, '#a855f7');
    assert.equal(taskA.body.due_time, '14:30');
    assert.equal((await call('/tasks', { method: 'POST', cookie: accountA.cookie, body: { title: 'Horário inválido', due: '2026-11-20', due_time: '24:00' } })).status, 400);
    assert.equal((await call('/tasks', { method: 'POST', cookie: accountA.cookie, body: { title: 'Data inválida', due: '2026-02-30' } })).status, 400);
    assert.equal((await call('/tasks', { method: 'POST', cookie: accountA.cookie, body: { title: 'Sem data', due_time: '12:30' } })).status, 400);
    const accountB = await call('/auth/register', {
      method: 'POST', body: { name: 'Bruno', email: 'bruno@example.com', password: 'outra-senha-123' },
    });
    assert.equal(accountB.status, 201);
    assert.ok(!(await call('/task-types', { cookie: accountB.cookie })).body.some(type => type.name === 'Leitura'));
    assert.equal((await call('/tasks', { method: 'POST', cookie: accountB.cookie,
      body: { title: 'Tipo de outra conta', type_id: customType.body.id } })).status, 400);
    assert.deepEqual((await call('/tasks', { cookie: accountB.cookie })).body, []);
    assert.equal((await call('/tasks/' + taskA.body.id, { method: 'PATCH', cookie: accountB.cookie, body: { done: true } })).status, 404);
    await call('/tasks/' + taskA.body.id, { method: 'DELETE', cookie: accountB.cookie });
    assert.equal((await call('/tasks', { cookie: accountA.cookie })).body.length, 1);
    const changed = await call('/tasks/' + taskA.body.id, { method: 'PATCH', cookie: accountA.cookie, body: { done: true } });
    assert.equal(changed.body.done, true);
    assert.equal(changed.body.due_time, '14:30');
    assert.equal((await call('/auth/login', { method: 'POST', body: { ...alice, password: 'incorreta' } })).status, 401);
    await stop();
    await start();
    assert.equal((await call('/auth/me', { cookie: accountA.cookie })).body.user.name, 'Alice');
    assert.equal((await call('/tasks', { cookie: accountA.cookie })).body.length, 1);
    assert.equal((await call('/tasks', { cookie: accountA.cookie })).body[0].due_time, '14:30');
    assert.equal((await call('/task-types', { cookie: accountA.cookie })).body.length, typesA.body.length + 1);
    await call('/auth/logout', { method: 'POST', cookie: accountA.cookie });
    assert.equal((await call('/tasks', { cookie: accountA.cookie })).status, 401);
    const login = await call('/auth/login', { method: 'POST', body: alice });
    assert.equal(login.status, 200);
    assert.notEqual(login.cookie, accountA.cookie);
    await call('/tasks/' + taskA.body.id, { method: 'DELETE', cookie: login.cookie });
    assert.deepEqual((await call('/tasks', { cookie: login.cookie })).body, []);
    const inspection = new Database(databasePath);
    assert.equal(inspection.prepare('SELECT title FROM tasks WHERE user_id IS NULL').get().title, 'Tarefa antiga');
    const stored = inspection.prepare('SELECT password_hash FROM users WHERE id = ?').get(accountA.body.user.id);
    assert.ok(!stored.password_hash.includes(alice.password));
    inspection.prepare('UPDATE sessions SET expires_at = 0').run();
    inspection.close();
    assert.equal((await call('/tasks', { cookie: login.cookie })).status, 401);
  } finally {
    await stop();
    await rm(directory, { recursive: true, force: true });
  }
});
