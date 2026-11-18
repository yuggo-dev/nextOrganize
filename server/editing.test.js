import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {openDatabase} from './src/infrastructure/database.js';
import {createApp} from './src/app.js';
import {seedTaskTypes} from './src/domains/task-types/repository.js';

test('type edits and task moves preserve history and enforce ownership',async t=>{
 const db=openDatabase(':memory:');const server=createApp(db,'missing-dist').listen(0);await once(server,'listening');
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));db.close();});
 const call=async(path,{method='GET',body,cookie}={})=>{
  const r=await fetch(`http://localhost:${server.address().port}/api`+path,{method,headers:{'Content-Type':'application/json','X-Requested-With':'tarefas',...(cookie?{Cookie:cookie}:{})},body:body&&JSON.stringify(body)});
  return {status:r.status,body:r.status===204?null:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
 };
 const a=await call('/auth/register',{method:'POST',body:{name:'A',email:'a@edit.test',password:'test-password'}});
 const b=await call('/auth/register',{method:'POST',body:{name:'B',email:'b@edit.test',password:'test-password'}});
 const types=(await call('/task-types',{cookie:a.cookie})).body;const first=types[0];const second=types[1];
 const task=await call('/tasks',{method:'POST',cookie:a.cookie,body:{title:'Original',type_id:first.id,due:'2026-11-18',due_time:'08:00'}});
 const patch={method:'PATCH',cookie:a.cookie,body:{name:'Projetos',color:'#ABCDEF',icon:'FaBriefcase'}};
 assert.equal((await call(`/task-types/${first.id}`,{...patch,cookie:b.cookie})).status,404);
 for(const body of [{name:'',color:'#123456'},{name:'Tipo',color:'red'}])assert.equal((await call(`/task-types/${first.id}`,{...patch,body})).status,400);
 assert.equal((await call(`/task-types/${first.id}`,{...patch,body:{name:second.name,color:'#123456'}})).status,409);
 const updated=await call(`/task-types/${first.id}`,patch);assert.equal(updated.status,200);assert.equal(updated.body.color,'#abcdef');assert.equal(updated.body.icon,'FaBriefcase');
 const list=(await call('/tasks',{cookie:a.cookie})).body;assert.equal(list[0].category,'Projetos');assert.equal(list[0].category_color,'#abcdef');assert.equal(list[0].category_icon,'FaBriefcase');
 const preserved=await call(`/task-types/${first.id}`,{...patch,body:{name:'Projetos',color:'#123456'}});assert.equal(preserved.body.icon,'FaBriefcase');
 assert.equal((await call(`/task-types/${first.id}`,{...patch,body:{name:'Projetos',color:'#123456',icon:'javascript:alert(1)'}})).status,400);
 const reset=await call(`/task-types/${first.id}`,{...patch,body:{name:'Projetos',color:'#abcdef',icon:null}});assert.equal(reset.body.icon,null);
 assert.equal(db.prepare('SELECT category FROM tasks WHERE id=?').get(task.body.id).category,'Projetos');
 seedTaskTypes(db,a.body.user.id);assert.equal((await call('/task-types',{cookie:a.cookie})).body.length,types.length);
 const moved=await call(`/tasks/${task.body.id}`,{method:'PATCH',cookie:a.cookie,body:{title:'Renomeada',due:'2026-11-23',due_time:'15:30',type_id:second.id}});
 assert.equal(moved.status,200);assert.equal(moved.body.id,task.body.id);assert.equal(moved.body.title,'Renomeada');assert.equal(moved.body.due,'2026-11-23');assert.equal(moved.body.type_id,second.id);
 assert.equal((await call(`/tasks/${task.body.id}`,{method:'PATCH',cookie:b.cookie,body:{title:'Invadida'}})).status,404);
 const recurring=await call('/tasks',{method:'POST',cookie:a.cookie,body:{title:'Rotina',type_id:second.id,due:'2026-11-16',recurrence:'weekly',recurrence_days:[1,3,5]}});
 await call(`/tasks/${recurring.body.id}`,{method:'PATCH',cookie:a.cookie,body:{occurrence_date:'2026-11-18',done:true}});
 const edited=await call(`/tasks/${recurring.body.id}`,{method:'PATCH',cookie:a.cookie,body:{title:'Rotina nova',type_id:first.id,due_time:'10:00'}});
 assert.equal(edited.status,200);assert.deepEqual(edited.body.occurrences,[{due:'2026-11-18',done:true,skipped:false}]);assert.deepEqual(edited.body.recurrence_days,[1,3,5]);
});
