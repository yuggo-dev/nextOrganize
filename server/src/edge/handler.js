import { authService, tokenHash } from '../domains/auth/service.js';
import { taskService } from '../domains/tasks/service.js';
import { taskTypeRepository } from '../domains/task-types/repository.js';
import { httpError } from '../shared/http.js';

export function createEdgeHandler({ getDatabase, allowedOrigins }) {
  const origins = new Set(allowedOrigins);
  return async request => {
    const origin = request.headers.get('origin');
    const headers = new Headers({ 'Content-Type':'application/json', 'Cache-Control':'no-store', Vary:'Origin' });
    if (origin && !origins.has(origin)) return new Response(JSON.stringify({error:'Origem não autorizada.'}),{status:403,headers});
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Headers','authorization, content-type, x-requested-with, apikey, x-client-info');
    headers.set('Access-Control-Allow-Methods','GET, POST, PATCH, DELETE, OPTIONS');
    const json = (body,status=200) => new Response(status===204 ? null : JSON.stringify(body),{status,headers});
    if (request.method==='OPTIONS') return new Response(null,{status:204,headers});
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/functions\/v1\/tarefas-api(?=\/|$)/,'').replace(/^\/tarefas-api(?=\/|$)/,'').replace(/\/$/,'') || '/';
      if (path==='/healthz' && request.method==='GET') return json({status:'ok'});
      if (!['GET','POST','PATCH','DELETE'].includes(request.method)) return json({error:'Método não permitido.'},405);
      if (request.method!=='GET' && request.headers.get('x-requested-with')!=='tarefas') throw httpError(403,'Requisição inválida.');
      let body = {};
      if (['POST','PATCH'].includes(request.method)) {
        if (!request.headers.get('content-type')?.startsWith('application/json')) throw httpError(415,'Envie JSON.');
        const reader=request.body?.getReader();
        const chunks=[]; let size=0;
        if (reader) {
          while (true) {
            const {done,value}=await reader.read();
            if (done) break;
            size+=value.byteLength;
            if (size>16384) { await reader.cancel(); throw httpError(413,'Corpo muito grande.'); }
            chunks.push(value);
          }
        }
        const bytes=new Uint8Array(size); let offset=0;
        for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
        try { body=JSON.parse(new TextDecoder().decode(bytes) || '{}'); } catch { throw httpError(400,'JSON inválido.'); }
        if (!body || typeof body!=='object' || Array.isArray(body)) throw httpError(400,'Envie um objeto JSON.');
      }
      const db = await getDatabase();
      const auth=authService(db);
      const token=request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1] || '';
      const hash=tokenHash(token);
      if (['/auth/register','/auth/login'].includes(path) && request.method==='POST') {
        // Persisted across isolates; no reliance on worker-local memory for brute-force protection.
        const identity=tokenHash(String(body.email || '').trim().toLowerCase());
        const now=Date.now();
        await db.query('DELETE FROM tarefas.auth_attempts WHERE expires_at <= $1',[now]);
        const {rows}=await db.query(`INSERT INTO tarefas.auth_attempts(key,attempts,expires_at) VALUES($1,1,$2)
          ON CONFLICT(key) DO UPDATE SET attempts=tarefas.auth_attempts.attempts+1 RETURNING attempts`,[identity,now+15*60*1000]);
        if(rows[0].attempts>30) { headers.set('Retry-After','900'); throw httpError(429,'Muitas tentativas. Tente novamente em alguns minutos.'); }
        const user = path.endsWith('/register') ? await auth.register(body) : await auth.login(body);
        if(token) await auth.removeSession(hash);
        return json({user,token:await auth.createSession(user.id)},path.endsWith('/register')?201:200);
      }
      const user=token ? await auth.findSession(hash) : null;
      if(path==='/auth/me' && request.method==='GET') return json({user:user || null});
      if(path==='/auth/logout' && request.method==='POST') { if(token) await auth.removeSession(hash); return json(null,204); }
      if(!user) throw httpError(401,'Entre na sua conta para acessar as tarefas.');
      const tasks=taskService(db);
      const types=taskTypeRepository(db);
      if(path==='/tasks' && request.method==='GET') return json(await tasks.list(user.id));
      if(path==='/tasks' && request.method==='POST') return json(await tasks.create(body,user.id),201);
      const taskPath=path.match(/^\/tasks\/([1-9]\d*)$/);
      if(taskPath) {
        const id=Number(taskPath[1]);
        if(!Number.isSafeInteger(id) || id>2147483647) throw httpError(404,'Tarefa não encontrada.');
        if(request.method==='PATCH') return json(await tasks.update(id,body,user.id));
        if(request.method==='DELETE') {
          const updated=await tasks.remove(id,user.id,url.searchParams.get('date') ?? undefined);
          return updated ? json(updated) : json(null,204);
        }
      }
      if(path==='/task-types' && request.method==='GET') return json(await types.list(user.id));
      if(path==='/task-types' && request.method==='POST') {
        if(typeof body.name!=='string' || !body.name.trim() || body.name.trim().length>60) throw httpError(400,'Informe um tipo de até 60 caracteres.');
        if(typeof body.color!=='string' || !/^#[0-9a-f]{6}$/i.test(body.color)) throw httpError(400,'Escolha uma cor válida.');
        try { return json(await types.create(body.name.trim(),body.color.toLowerCase(),user.id),201); }
        catch(error) { if(error.code==='23505') throw httpError(409,'Você já possui um tipo com esse nome.'); throw error; }
      }
      return json({error:'Rota não encontrada.'},404);
    } catch(error) {
      const status=error.status>=400 && error.status<500 ? error.status : 500;
      if(status===500) console.error('Erro na API Edge.',error.code || 'interno');
      return json({error:status===500 ? 'Não foi possível concluir a operação.' : error.message},status);
    }
  };
}
