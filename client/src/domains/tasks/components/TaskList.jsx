import { useEffect, useRef } from "react";
import { isOverdue } from "../model/schedule.js";

const priorities = { 1: "Alta", 2: "Média", 3: "Baixa" };

function TaskCard({ task, now, pending, onToggle, onDelete, onDeleteSeries }) {
  const late = isOverdue(task, now);
  const daily = task.recurrence === "daily";
  const date = task.due ? task.due.split("-").reverse().slice(0, 2).join("/") : "Sem prazo";

  return (
    <div className={`agenda-entry${daily ? " daily-entry" : ""}`} style={{ "--type-color": task.category_color }}>
      {!daily && <div className="agenda-time">
        {task.due_time ? <time dateTime={`${task.due}T${task.due_time}`}>{task.due_time}</time> : <span>{task.due ? "Sem horário" : "Sem prazo"}</span>}
        <span className="agenda-rule" aria-hidden="true" />
        <span className="agenda-date">{date}</span>
      </div>}
      <article
        className={`task-card${late ? " overdue" : ""}${task.done ? " completed" : ""}`}
        aria-busy={pending}
      >
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
          <div className="task-topline">
            <span className="task-title" title={task.title}>{task.title}</span>
          </div>
          <div className="task-details">
            <span className="task-type" title={task.category}>
              <i className="type-dot" aria-hidden="true" />
              <span>{task.category}</span>
            </span>
            <span className={`priority priority-${task.priority}`} title={`Prioridade ${priorities[task.priority].toLowerCase()}`}>
              {priorities[task.priority]}
            </span>
            {late && <span className="overdue-badge">Atrasada</span>}
            {task.done && <span className="done-label">Concluída</span>}
          </div>
          {daily && <div className="daily-card-meta">
            <span className="daily-label">↻ Diária</span>
            {task.streak > 0 && <span className="streak-label" title={`Combo atual de ${task.streak} ${task.streak === 1 ? "dia cumprido" : "dias cumpridos"} em sequência`}>Combo · {task.streak}d</span>}
            <span className="daily-card-deadline">
              {task.due_time ? <time dateTime={`${task.due}T${task.due_time}`} title="Horário de conclusão">{task.due_time}</time> : <span>Sem horário</span>}
              <span>· {date}</span>
            </span>
          </div>}
        </div>
        {task.source_id ? <select
          className="daily-actions"
          aria-label={`Ações da tarefa diária ${task.title}`}
          disabled={pending}
          value=""
          onChange={event => {
            if (event.target.value === "day") onDelete(task);
            if (event.target.value === "series") onDeleteSeries(task);
          }}
        >
          <option value="" disabled>⋯</option>
          <option value="day">Remover só deste dia</option>
          <option value="series">Excluir diária e histórico</option>
        </select> : <button
          type="button"
          className="delete-task icon-button"
          disabled={pending}
          aria-label={`Excluir ${task.title}`}
          onClick={() => onDelete(task)}
        >×</button>}
      </article>
    </div>
  );
}

export default function TaskList({
  tasks, now, loading, searching, viewKey,
  onToggle, onDelete, onDeleteSeries, pendingIds, onAdd,
}) {
  const space = useRef(null);
  useEffect(() => {
    space.current.scrollTop = 0;
  }, [viewKey]);

  const dailyTasks = tasks.filter(task => task.recurrence === "daily");
  const otherTasks = tasks.filter(task => task.recurrence !== "daily");
  const renderCard = task => (
    <TaskCard
      key={task.id}
      task={task}
      now={now}
      pending={pendingIds.has(task.id)}
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
      {loading ? <div className="empty-state" role="status">Carregando tarefas…</div> : tasks.length ? <>
        {dailyTasks.length > 0 && <details className="task-group daily-task-group" open>
          <summary className="task-group-heading" title="Expandir ou recolher as tarefas diárias">
            <span className="daily-group-title">Rotina diária</span>
            <span className="daily-group-meta">
              <span>{dailyTasks.filter(task => task.done).length}/{dailyTasks.length} concluídas</span>
              <i className="daily-group-chevron" aria-hidden="true" />
            </span>
          </summary>
          <div className="daily-group-content">{dailyTasks.map(renderCard)}</div>
        </details>}
        {otherTasks.length > 0 && <section className="task-group" aria-label="Outras atividades">
          {dailyTasks.length > 0 && <header className="task-group-heading">
            <h3>Outras atividades</h3>
            <span>{otherTasks.length} atividades</span>
          </header>}
          {otherTasks.map(renderCard)}
        </section>}
      </> : (
          <div className="empty-state" role="status">
            <span className="empty-symbol" aria-hidden="true">{searching ? "⌕" : "✓"}</span>
            <h3>{searching ? "Nenhuma atividade encontrada" : "Agenda livre por aqui"}</h3>
            <p>{searching ? "Tente outro título ou tipo de tarefa." : "Adicione uma tarefa para organizar seu dia."}</p>
            {!searching && <button type="button" onClick={onAdd}>+ Nova tarefa</button>}
          </div>
        )}
    </div>
  );
}
