import { useEffect, useRef, useState } from "react";
import { FiEdit3, FiTrash2, FiMoreHorizontal, FiRepeat, FiClock, FiXCircle, FiPlus, FiMapPin } from "react-icons/fi";
import { shiftDate, scheduledOn } from "../model/recurrence.js";
import TypeIcon from "../../task-types/icons.jsx";
import { isOverdue } from "../model/schedule.js";

const priorities = { 1: "Alta", 2: "Média", 3: "Baixa" };

function WeekTrack({ task }) {
  const weekday = new Date(`${task.due}T12:00:00Z`).getUTCDay();
  const monday = shiftDate(task.due, -((weekday + 6) % 7));
  const history = new Map((task.occurrences || []).map(day => [day.due, day]));
  return <div className="week-track" role="group" aria-label="Ocorrências da semana desta tarefa">
    <span className="week-track-label">Seu ritmo</span>
    {["S", "T", "Q", "Q", "S", "S", "D"].map((label, index) => {
      const date = shiftDate(monday, index);
      const planned = date >= (task.series_start || task.due) && (!task.recurrence_until || date <= task.recurrence_until) && scheduledOn(task, date);
      const entry = history.get(date);
      const status = !planned ? "fora da programação" : entry?.skipped ? "removida" : entry?.done ? "concluída" : "em aberto";
      const description = `${date.split("-").reverse().join("/")}: ${status}`;
      return <span key={date} role="img" aria-label={description} title={description} className={`week-step${planned ? " planned" : ""}${planned && entry?.done && !entry.skipped ? " achieved" : ""}${entry?.skipped ? " skipped" : ""}${date === task.due ? " selected-step" : ""}`}>
        {planned && entry?.done && !entry.skipped ? "✓" : entry?.skipped ? "−" : label}
      </span>;
    })}
  </div>;
}

function TaskCard({ task, now, pending, onToggle, onDelete, onDeleteSeries, onEdit, focused }) {
  const previousDone = useRef(task.done);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    const justCompleted = task.done && !previousDone.current;
    previousDone.current = task.done;
    if (!task.done) setCelebrating(false);
    if (!justCompleted) return;
    setCelebrating(true);
    const timer = setTimeout(() => setCelebrating(false), 1100);
    return () => clearTimeout(timer);
  }, [task.done]);
  const late = isOverdue(task, now);
  const daily = ["daily", "weekly"].includes(task.recurrence);
  const date = task.due ? task.due.split("-").reverse().slice(0, 2).join("/") : "Sem prazo";

  return (
    <div className={`agenda-entry${daily ? " daily-entry" : ""}`} style={{ "--type-color": task.category_color }}>
      {!daily && <div className="agenda-time">
        {task.due_time ? <time dateTime={`${task.due}T${task.due_time}`}>{task.due_time}</time> : <span>{task.due ? "Sem horário" : "Sem prazo"}</span>}
        <span className="agenda-rule" aria-hidden="true" />
        <span className="agenda-date">{date}</span>
      </div>}
      <article
        className={`task-card${focused ? " focus-task" : ""}${celebrating ? " just-completed" : ""}${late ? " overdue" : ""}${task.done ? " completed" : ""}`}
        aria-busy={pending}
      >
        {celebrating && <span className="completion-spark" aria-hidden="true">✦</span>}
        <label className="task-check">
          <input
            type="checkbox"
            checked={task.done}
            disabled={pending}
            onChange={() => onToggle(task)}
            aria-label={`${task.done ? "Reabrir" : "Concluir"} ${task.title}`}
          />
        </label>
        <div className="task-content">
          <div className="task-identity">
            <span className="task-theme-icon" title={task.category}><TypeIcon icon={task.category_icon} name={task.category} /></span>
            <div className="task-identity-copy">
          {focused && !task.done && <span className="task-focus-label">✦ Seu próximo passo</span>}
          <div className="task-topline">
            <span className="task-title" title={task.title}>{task.title}</span>
          </div>
          <div className="task-details">
            <span className="task-type" title={task.category}>
              <span>{task.category}</span>
            </span>
            <span className={`priority priority-${task.priority}`} title={`Prioridade ${priorities[task.priority].toLowerCase()}`}>
              {priorities[task.priority]}
            </span>
            {late && <span className="overdue-badge">Atrasada</span>}
            {task.done && <span className="done-label">✓ Você conseguiu</span>}
          </div>
            </div>
          </div>
          {daily && <div className="daily-card-meta">
            {task.recurrence === "weekly" && <span className="task-type" title="Dias programados">{(task.recurrence_days || []).map(day => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][day]).join(" · ")}</span>}
            <span className="daily-label"><FiRepeat aria-hidden="true" /> {task.recurrence === "weekly" ? "Periódica" : "Diária"}</span>
            {task.streak > 0 && <span className="streak-label" title={`Combo atual de ${task.streak} ${task.streak === 1 ? "dia cumprido" : "dias cumpridos"} em sequência`}>Combo · {task.streak}{task.recurrence === "weekly" ? "x" : "d"}</span>}
            <span className="daily-card-deadline">
              {task.due_time ? <time dateTime={`${task.due}T${task.due_time}`} title="Horário de conclusão"><FiClock aria-hidden="true" /> {task.due_time}</time> : <span>Sem horário</span>}
              <span>· {date}</span>
            </span>
          </div>}
          {daily && <WeekTrack task={task} />}
        </div>
        <div className="task-card-actions">
          <button type="button" className="edit-task task-action" disabled={pending} onClick={() => onEdit(task)} aria-label={`Editar ou mover ${task.title}`} title="Editar ou mover tarefa"><FiEdit3 aria-hidden="true" /><span>Editar</span></button>
          {task.source_id ? <details className="task-more" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}>
            <summary aria-label={`Mais ações de ${task.title}`} title="Mais ações"><FiMoreHorizontal aria-hidden="true" /></summary>
            <div className="task-action-menu">
              <button type="button" disabled={pending} onClick={event => { event.currentTarget.closest("details").open = false; onDelete(task); }}><FiXCircle aria-hidden="true" />Remover só deste dia</button>
              <button type="button" disabled={pending} onClick={event => { event.currentTarget.closest("details").open = false; onDeleteSeries(task); }}><FiTrash2 aria-hidden="true" />Excluir repetição e histórico</button>
            </div>
          </details> : <button type="button" className="delete-task task-action" disabled={pending} aria-label={`Excluir ${task.title}`} title="Excluir tarefa" onClick={() => onDelete(task)}><FiTrash2 aria-hidden="true" /></button>}
        </div>
      </article>
    </div>
  );
}

export default function TaskList({
  tasks, now, loading, searching, viewKey,
  onToggle, onDelete, onDeleteSeries, onEdit, pendingIds, onAdd, progressTasks,
}) {
  const space = useRef(null);
  useEffect(() => {
    space.current.scrollTop = 0;
  }, [viewKey]);

  const total = progressTasks?.length || 0;
  const completed = progressTasks?.filter(task => task.done).length || 0;
  const percent = total ? Math.round(completed / total * 100) : 0;
  const nextTask = tasks.find(task => !task.done && !isOverdue(task, now)) || tasks.find(task => !task.done);
  const dailyTasks = tasks.filter(task => ["daily", "weekly"].includes(task.recurrence));
  const otherTasks = tasks.filter(task => !["daily", "weekly"].includes(task.recurrence));
  const renderCard = task => (
    <TaskCard
      key={task.id}
      task={task}
      focused={task.id === nextTask?.id}
      now={now}
      pending={pendingIds.has(task.id)}
      onEdit={onEdit}
      onToggle={onToggle}
      onDelete={onDelete}
      onDeleteSeries={onDeleteSeries}
    />
  );

  return (
    <div
      ref={space}
      className="task-list-space"
      role="region"
      aria-label="Atividades com rolagem"
      aria-busy={loading}
      tabIndex={0}
    >
      {!loading && total > 0 && <section className={`day-momentum${completed === total ? " momentum-complete" : ""}`} aria-label="Progresso das tarefas do dia selecionado">
        <div className="momentum-ring" style={{"--progress": `${percent}%`}} aria-hidden="true"><span>{completed === total ? "✓" : `${percent}%`}</span></div>
        <div className="momentum-copy">
          <span className="momentum-eyebrow">CADA PASSO CONTA</span>
          <strong>{completed === total ? "Você concluiu o dia!" : completed ? "Olha o quanto você já fez." : "Uma tarefa de cada vez."}</strong>
          <span>{completed} de {total} {total === 1 ? "tarefa concluída" : "tarefas concluídas"}{completed === total ? " · Boa conquista!" : " · No seu ritmo."}</span>
          <progress value={completed} max={total} aria-label={`${completed} de ${total} tarefas concluídas no dia selecionado`} />
        </div>
        <span className="momentum-decoration" aria-hidden="true">✦</span>
      </section>}
      {loading ? <div className="empty-state" role="status">Carregando tarefas…</div> : tasks.length ? <>
        {dailyTasks.length > 0 && <details className="task-group daily-task-group" open>
          <summary className="task-group-heading" title="Expandir ou recolher as atividades regulares">
            <span className="daily-group-title"><FiRepeat aria-hidden="true" /> Atividades regulares</span>
            <span className="daily-group-meta">
              <span>{dailyTasks.filter(task => task.done).length}/{dailyTasks.length} concluídas</span>
              <i className="daily-group-chevron" aria-hidden="true" />
            </span>
          </summary>
          <div className="daily-group-content">{dailyTasks.map(renderCard)}</div>
        </details>}
        {otherTasks.length > 0 && <section className="task-group" aria-label="Atividades pontuais">
          {<header className="task-group-heading">
            <h3><FiMapPin aria-hidden="true" /> Atividades pontuais</h3>
            <span>{otherTasks.length} atividades</span>
          </header>}
          {otherTasks.map(renderCard)}
        </section>}
      </> : (
          <div className="empty-state" role="status">
            <span className="empty-symbol" aria-hidden="true">{searching ? "⌕" : "✓"}</span>
            <h3>{searching ? "Nenhuma atividade encontrada" : "Agenda livre por aqui"}</h3>
            <p>{searching ? "Tente outro título ou tipo de tarefa." : "Adicione uma tarefa para organizar seu dia."}</p>
            {!searching && <button type="button" onClick={onAdd}><FiPlus aria-hidden="true" /> Nova tarefa</button>}
          </div>
        )}
    </div>
  );
}
