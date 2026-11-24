import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { postgresDatabase } from './src/infrastructure/postgres.js';
import { createEdgeHandler } from './src/edge/handler.js';
import { createApp } from './src/app.js';

test('PostgreSQL API supports accounts, ownership, transactions and daily history', async () => {
  const engine = new PGlite();
  // Todas as migrações, na mesma ordem usada pelos scripts do projeto.
  const migrations = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) {
    await engine.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
  // The same SQL and transaction adapter used by node-postgres, backed by a real embedded PostgreSQL.
  const query = (sql, params) => engine.query(sql, params);
  const db = postgresDatabase({ query, connect: async () => ({ query, release() {} }), end: () => engine.close() });
  const server = createApp(db, '/nonexistent').listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (route, {method='GET', body, cookie} = {}) => {
    const response = await fetch(base+route, {method, headers: {'Content-Type':'application/json','X-Requested-With':'tarefas', ...(cookie ? {Cookie:cookie} : {})}, body: body && JSON.stringify(body)});
    return {status:response.status, body:response.status===204 ? null : await response.json(), cookie:response.headers.get('set-cookie')?.split(';')[0]};
  };
  try {
    assert.equal((await call('/tasks')).status,401);
    const alice = {name:'Alice',email:'alice@example.test',password:'secret-password'};
    const a = await call('/auth/register',{method:'POST',body:alice});
    assert.equal(a.status,201);
    assert.equal((await call('/auth/register',{method:'POST',body:alice})).status,409);
    assert.equal((await call('/auth/me',{cookie:a.cookie})).body.user.name,'Alice');
    const b = await call('/auth/register',{method:'POST',body:{...alice,name:'Bob',email:'bob@example.test'}});
    const type = await call('/task-types',{method:'POST',cookie:a.cookie,body:{name:'Casa',color:'#abcdef'}});
    assert.equal(type.status,201);
    assert.equal((await call('/task-types',{method:'POST',cookie:a.cookie,body:{name:'casa',color:'#abcdef'}})).status,409);
    assert.equal((await call('/tasks',{method:'POST',cookie:b.cookie,body:{title:'Invalid',type_id:type.body.id}})).status,400);
    const task = await call('/tasks',{method:'POST',cookie:a.cookie,body:{title:'Diária',type_id:type.body.id,recurrence:'daily',due:'2026-11-17',due_time:'12:30'}});
    assert.equal(task.status,201);
    assert.equal(task.body.category,'Casa');
    // Regulares não têm horário de conclusão: o horário enviado por clientes antigos vira notificação.
    assert.equal(task.body.due_time,null);
    assert.equal(task.body.notify_time,'12:30');
    assert.equal(task.body.tracks_overdue,true);
    assert.deepEqual((await call('/tasks',{cookie:b.cookie})).body,[]);
    assert.equal((await call(`/tasks/${task.body.id}`,{method:'PATCH',cookie:b.cookie,body:{title:'Invadida'}})).status,404);
    for (let i=0;i<2;i++) {
      const updated = await call(`/tasks/${task.body.id}`,{method:'PATCH',cookie:a.cookie,body:{occurrence_date:'2026-11-17',done:true}});
      assert.equal(updated.status,200);
      assert.deepEqual(updated.body.occurrences,[{due:'2026-11-17',done:true,skipped:false}]);
    }
    await call(`/tasks/${task.body.id}?date=2026-11-18`,{method:'DELETE',cookie:a.cookie});
    const listed = await call('/tasks',{cookie:a.cookie});
    assert.equal(listed.body[0].occurrences[1].skipped,true);
    assert.equal(listed.body[0].done,false);
    await assert.rejects(db.transaction(async () => {
      await db.query("INSERT INTO tarefas.task_types(user_id,name,color) VALUES($1,'Rollback','#123456')",[a.body.user.id]);
      throw new Error('rollback');
    })());
    assert.equal((await db.query("SELECT count(*)::int AS n FROM tarefas.task_types WHERE name='Rollback'")).rows[0].n,0);
    await call(`/tasks/${task.body.id}`,{method:'DELETE',cookie:a.cookie});
    assert.equal((await db.query('SELECT count(*)::int AS n FROM tarefas.task_occurrences')).rows[0].n,0);
    await call('/auth/logout',{method:'POST',cookie:a.cookie});
    assert.equal((await call('/tasks',{cookie:a.cookie})).status,401);
    assert.equal((await call('/auth/login',{method:'POST',body:{...alice,password:'wrong'}})).status,401);
    assert.equal((await call('/auth/login',{method:'POST',body:alice})).status,200);
    const handler = createEdgeHandler({ getDatabase: async () => db, allowedOrigins: ['https://frontend.example.test'] });
    const edge = async (route, {method='GET',body,token,origin='https://frontend.example.test'}={}) => {
      const response=await handler(new Request('https://project.supabase.co/functions/v1/tarefas-api'+route, {
        method,headers:{Origin:origin,'Content-Type':'application/json','X-Requested-With':'tarefas',...(token?{Authorization:'Bearer '+token}:{})},body:body&&JSON.stringify(body),
      }));
      return {status:response.status,body:response.status===204?null:await response.json(),headers:response.headers};
    };
    assert.equal((await edge('/tasks',{origin:'https://untrusted.example.test'})).status,403);
    const preflight=await edge('/tasks',{method:'OPTIONS'});
    assert.equal(preflight.status,204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://frontend.example.test');
    assert.equal((await edge('/tasks')).status,401);
    const login=await edge('/auth/login',{method:'POST',body:alice});
    assert.equal(login.status,200);
    assert.match(login.body.token,/^[a-f0-9]{64}$/);
    const token=login.body.token;
    assert.equal((await edge('/auth/me',{token})).body.user.email,alice.email);
    const rename={name:'Projetos',color:'#ABCDEF',icon:'FaBriefcase'};
    assert.equal((await call('/task-types/'+type.body.id,{method:'PATCH',cookie:b.cookie,body:rename})).status,404);
    assert.equal((await edge('/task-types/'+type.body.id,{method:'PATCH',token,body:rename})).status,200);
    const changeable=await edge('/tasks',{method:'POST',token,body:{title:'Mover',type_id:type.body.id,due:'2026-11-18'}});
    assert.equal(changeable.body.category,'Projetos');
    assert.equal(changeable.body.category_icon,'FaBriefcase');
    const withoutIcon=await edge('/task-types/'+type.body.id,{method:'PATCH',token,body:{name:'Projetos',color:'#ABCDEF'}});
    assert.equal(withoutIcon.body.icon,'FaBriefcase');
    assert.equal((await edge('/task-types/'+type.body.id,{method:'PATCH',token,body:{...rename,icon:'<script>'}})).status,400);
    assert.equal(changeable.body.category_color,'#abcdef');
    const defaults=(await edge('/task-types',{token})).body;
    const destination=defaults.find(item=>item.id!==type.body.id);
    const moved=await edge('/tasks/'+changeable.body.id,{method:'PATCH',token,body:{title:'Movida',due:'2026-11-23',due_time:'15:30',type_id:destination.id}});
    assert.equal(moved.status,200);assert.equal(moved.body.due,'2026-11-23');assert.equal(moved.body.title,'Movida');assert.equal(moved.body.type_id,destination.id);
    assert.equal((await edge('/tasks/'+changeable.body.id,{method:'DELETE',token})).status,204);

    const weekly=await edge('/tasks',{method:'POST',token,body:{title:'Semanal',recurrence:'weekly',recurrence_days:[5,1,3,1],due:'2026-11-16',recurrence_until:'2026-11-27'}});
    assert.equal(weekly.status,201);
    assert.deepEqual(weekly.body.recurrence_days,[1,3,5]);
    assert.equal((await edge('/tasks/'+weekly.body.id,{method:'PATCH',token,body:{occurrence_date:'2026-11-17',done:true}})).status,400);
    assert.equal((await edge('/tasks/'+weekly.body.id,{method:'PATCH',token,body:{occurrence_date:'2026-11-30',done:true}})).status,400);
    assert.equal((await edge('/tasks/'+weekly.body.id,{method:'PATCH',token,body:{occurrence_date:'2026-11-18',done:true}})).body.occurrences[0].done,true);
    assert.equal((await edge('/tasks/'+weekly.body.id,{method:'DELETE',token})).status,204);

    const created=await edge('/tasks',{method:'POST',token,body:{title:'Remota',category:'Pessoal',due:'2026-11-17'}});
    assert.equal(created.status,201);
    const bobLogin=await edge('/auth/login',{method:'POST',body:{...alice,email:'bob@example.test'}});
    assert.deepEqual((await edge('/tasks',{token:bobLogin.body.token})).body,[]);
    assert.equal((await edge('/tasks/'+created.body.id,{method:'PATCH',token:bobLogin.body.token,body:{done:true}})).status,404);
    assert.equal((await edge('/tasks/'+created.body.id,{method:'PATCH',token,body:{done:true}})).body.done,true);
    await edge('/auth/logout',{method:'POST',token});
    assert.equal((await edge('/tasks',{token})).status,401);
    await db.query('UPDATE tarefas.auth_attempts SET attempts=30');
    assert.equal((await edge('/auth/login',{method:'POST',body:alice})).status,429);

  } finally {
    await new Promise(resolve => server.close(resolve));
    await db.close();
  }
});
