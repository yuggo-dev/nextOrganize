const defaults = [['Trabalho', '#6366f1'], ['Físico', '#14b8a6'], ['Alimentação', '#f59e0b'], ['Pessoal', '#ec4899'], ['Estudos', '#3b82f6']];
const one = async (db, sql, params) => (await db.query(sql, params)).rows[0];

export function postgresAuthRepository(db) {
  return {
    findUser: email => one(db, 'SELECT * FROM tarefas.users WHERE email=$1', [email]),
    createUser: db.transaction(async (name, email, hash) => {
      const user = await one(db, 'INSERT INTO tarefas.users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email', [name,email,hash]);
      for (const [name,color] of defaults) await db.query('INSERT INTO tarefas.task_types(user_id,name,color) VALUES($1,$2,$3)', [user.id,name,color]);
      return user;
    }),
    findSession: hash => one(db, `SELECT u.id,u.name,u.email FROM tarefas.sessions s JOIN tarefas.users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2`, [hash,Date.now()]),
    createSession: db.transaction(async (hash,userId,expiresAt) => {
      await db.query('DELETE FROM tarefas.sessions WHERE expires_at<=$1', [Date.now()]);
      await db.query('INSERT INTO tarefas.sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)', [hash,userId,expiresAt]);
    }),
    removeSession: hash => db.query('DELETE FROM tarefas.sessions WHERE token_hash=$1', [hash]),
  };
}
export function postgresTypeRepository(db) {
  return {
    update: db.transaction(async (id,name,color,userId,icon) => {
      const type=await one(db,'UPDATE tarefas.task_types SET name=$1,color=$2,icon=$5 WHERE id=$3 AND user_id=$4 RETURNING id,name,color,icon',[name,color,id,userId,icon ?? null]);
      if(!type) return undefined;
      await db.query('UPDATE tarefas.tasks SET category=$1 WHERE type_id=$2 AND user_id=$3',[name,id,userId]);
      return type;
    }),
    list: async userId => (await db.query('SELECT id,name,color,icon FROM tarefas.task_types WHERE user_id=$1 ORDER BY id', [userId])).rows,
    get: (id,userId) => one(db,'SELECT id,name,color,icon FROM tarefas.task_types WHERE id=$1 AND user_id=$2',[id,userId]),
    findByName: (name,userId) => one(db,'SELECT id,name,color,icon FROM tarefas.task_types WHERE lower(name)=lower($1) AND user_id=$2',[name,userId]),
    create: (name,color,userId,icon=null) => one(db,'INSERT INTO tarefas.task_types(name,color,user_id,icon) VALUES($1,$2,$3,$4) RETURNING id,name,color,icon',[name,color,userId,icon]),
  };
}
const select = `SELECT t.*, COALESCE(ty.name,t.category) AS category, COALESCE(ty.color,'#64748b') AS category_color, ty.icon AS category_icon
 FROM tarefas.tasks t LEFT JOIN tarefas.task_types ty ON ty.id=t.type_id AND ty.user_id=t.user_id`;
const taskFields = ['title','category','priority','due','due_time','notify_time','tracks_overdue','type_id','recurrence','recurrence_until','recurrence_days'];
const taskValues = task => taskFields.map(f => f==='recurrence_days' ? JSON.stringify(task[f]) : f==='tracks_overdue' ? (task[f] ? 1 : 0) : task[f]);
export function postgresTaskRepository(db) {
  async function history({user_id, ...task}) {
    task.done = !!task.done;
    task.tracks_overdue = task.tracks_overdue !== 0;
    task.recurrence_days = JSON.parse(task.recurrence_days || "[]");
    if (task.recurrence !== 'none') task.occurrences = (await db.query('SELECT due,done,skipped FROM tarefas.task_occurrences WHERE task_id=$1 ORDER BY due',[task.id])).rows.map(row=>({...row,done:!!row.done,skipped:!!row.skipped}));
    return task;
  }
  const get = async (id,userId) => {
    const row = await one(db,`${select} WHERE t.id=$1 AND t.user_id=$2`,[id,userId]);
    return row && history(row);
  };
  return {
    get,
    list: async userId => Promise.all((await db.query(`${select} WHERE t.user_id=$1 ORDER BY t.id DESC`,[userId])).rows.map(history)),
    async create(task,userId) {
      const n = taskFields.length;
      const row = await one(db,`INSERT INTO tarefas.tasks(${taskFields.join(',')},user_id) VALUES(${taskFields.map((_,i)=>`$${i+1}`).join(',')},$${n+1}) RETURNING id`,[...taskValues(task),userId]);
      return get(row.id,userId);
    },
    async update(id,task,userId) {
      const n = taskFields.length;
      await db.query(`UPDATE tarefas.tasks SET ${taskFields.map((f,i)=>`${f}=$${i+1}`).join(',')},done=$${n+1} WHERE id=$${n+2} AND user_id=$${n+3}`,[...taskValues(task),task.done?1:0,id,userId]);
      return get(id,userId);
    },
    async saveOccurrence(id,date,done,skipped,userId) {
      await db.query(`INSERT INTO tarefas.task_occurrences(task_id,due,done,skipped) SELECT id,$2,$3,$4 FROM tarefas.tasks WHERE id=$1 AND user_id=$5 ON CONFLICT(task_id,due) DO UPDATE SET done=excluded.done,skipped=excluded.skipped`,[id,date,done?1:0,skipped?1:0,userId]);
      return get(id,userId);
    },
    remove: (id,userId)=>db.query('DELETE FROM tarefas.tasks WHERE id=$1 AND user_id=$2',[id,userId]),
  };
}
