import { useEffect, useRef, useState } from "react";
import { FiEdit3, FiTrash2, FiMoreHorizontal, FiClock, FiXCircle, FiPlus, FiBell, FiCalendar } from "react-icons/fi";
import { shiftDate, scheduledOn } from "../model/recurrence.js";
import TypeIcon from "../../task-types/icons.jsx";
import { isMissed, isOverdue, isPending, isRegular, isoDate } from "../model/schedule.js";
import TodayChip from "../../../shared/components/TodayChip.jsx";

const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function scheduleText(task) {
  if (task.recurrence !== "weekly") return "Todo dia";
  const days = [...(task.recurrence_days || [])].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (days.length === 7) return "Todo dia";
  return days.map(day => weekdayNames[day]).join(" · ");
}

function useCelebration(done) {
  const previousDone = useRef(done);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    const justCompleted = done && !previousDone.current;
    previousDone.current = done;
    if (!done) setCelebrating(false);
    if (!justCompleted) return;
    setCelebrating(true);
    const timer = setTimeout(() => setCelebrating(false), 1100);
    return () => clearTimeout(timer);
  }, [done]);
  return celebrating;
}

// A semana da tarefa em sete pontos, de segunda a domingo; o rótulo de cada
// ponto (data e situação) fica no title e no aria-label.
function WeekDots({ task }) {
  const weekday = new Date(`${task.due}T12:00:00Z`).getUTCDay();
  const monday = shiftDate(task.due, -((weekday + 6) % 7));
  const history = new Map((task.occurrences || []).map(day => [day.due, day]));
  return <div className="week-dots" role="group" aria-label="Ocorrências da semana desta tarefa">
    {Array.from({ length: 7 }, (_, index) => {
      const date = shiftDate(monday, index);
      const planned = date >= (task.series_start || task.due) && (!task.recurrence_until || date <= task.recurrence_until) && scheduledOn(task, date);
      const entry = history.get(date);
      const status = !planned ? "fora da programação" : entry?.skipped ? "removida" : entry?.done ? "concluída" : "em aberto";
      const description = `${date.split("-").reverse().join("/")}: ${status}`;
      return <span key={date} role="img" aria-label={description} title={description} className={`week-step${planned ? " planned" : ""}${planned && entry?.done && !entry.skipped ? " achieved" : ""}${entry?.skipped ? " skipped" : ""}${date === task.due ? " selected-step" : ""}`} />;
    })}
  </div>;
}

const shortDate = due => due.split("-").reverse().slice(0, 2).join("/");

// Card enxuto, igual para regulares e pontuais: checkbox, ícone do tipo, título
// e uma linha de detalhes; ações ficam no menu de reticências.
// Regulares mostram a programação, o horário de notificação, o combo e a semana.
// Pontuais mostram o horário de conclusão (quando houver) e a data.
function TaskCard({ task, now, pending, onToggle, onDelete, onDeleteSeries, onEdit, focused, showDate }) {
  const celebrating = useCelebration(task.done);
  const regular = isRegular(task);
  const late = isOverdue(task, now);
  const missed = isMissed(task, now);
  const closeMenu = event => { event.currentTarget.closest("details").open = false; };
  return (
    <div className="agenda-entry regular-entry" style={{ "--type-color": task.category_color }}>
      <article
        className={`regular-card${focused ? " regular-next" : ""}${celebrating ? " just-completed" : ""}${late ? " overdue" : ""}${missed ? " missed" : ""}${task.done ? " completed" : ""}`}
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
        <span className="regular-icon" title={task.category}><TypeIcon icon={task.category_icon} name={task.category} /></span>
        <div className="regular-body">
          <span className="task-title" title={task.title}>{task.title}</span>
          <span className="regular-meta">
            {regular ? <>
              <span>{scheduleText(task)}</span>
              {task.notify_time && <span className="regular-notify" title="Horário de notificação"><FiBell aria-hidden="true" />{task.notify_time}</span>}
            </> : <>
              {task.due_time
                ? <time dateTime={`${task.due}T${task.due_time}`} title="Horário de conclusão"><FiClock aria-hidden="true" />{task.due_time}</time>
                : !task.due && <span>Sem prazo</span>}
              {task.priority === 1 && <span className="regular-priority">Prioridade alta</span>}
            </>}
            {task.due && showDate && (task.due === isoDate(now)
              ? <TodayChip className="today-chip-small" />
              : <span title="Data"><FiCalendar aria-hidden="true" />{shortDate(task.due)}</span>)}
            {late && <span className="regular-late">Atrasada</span>}
            {missed && <span className="regular-missed">Não feita</span>}
          </span>
        </div>
        {regular && task.streak > 0 && <span className="regular-streak" title={`Combo atual de ${task.streak} ${task.streak === 1 ? "vez cumprida" : "vezes cumpridas"} em sequência`}>
          {task.streak}{task.recurrence === "weekly" ? "x" : "d"}
        </span>}
        {regular && <WeekDots task={task} />}
        <details className="task-more" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}>
          <summary aria-label={`Ações de ${task.title}`} title="Ações"><FiMoreHorizontal aria-hidden="true" /></summary>
          <div className="task-action-menu">
            <button type="button" className="menu-edit" disabled={pending} onClick={event => { closeMenu(event); onEdit(task); }}><FiEdit3 aria-hidden="true" />Editar ou mover</button>
            {task.source_id ? <>
              <button type="button" disabled={pending} onClick={event => { closeMenu(event); onDelete(task); }}><FiXCircle aria-hidden="true" />Remover só deste dia</button>
              <button type="button" disabled={pending} onClick={event => { closeMenu(event); onDeleteSeries(task); }}><FiTrash2 aria-hidden="true" />Excluir repetição e histórico</button>
            </> : <button type="button" disabled={pending} onClick={event => { closeMenu(event); onDelete(task); }}><FiTrash2 aria-hidden="true" />Excluir</button>}
          </div>
        </details>
      </article>
    </div>
  );
}

function GroupLabel({ id, title, detail }) {
  return <h3 className="list-group-label" id={id}><span>{title}</span><small>{detail}</small></h3>;
}

export default function TaskList({
  tasks, now, loading, searching, viewKey, singleDay,
  onToggle, onDelete, onDeleteSeries, onEdit, pendingIds, onAdd, progressTasks,
}) {
  const space = useRef(null);
  useEffect(() => {
    space.current.scrollTop = 0;
  }, [viewKey]);

  const total = progressTasks?.length || 0;
  const completed = progressTasks?.filter(task => task.done).length || 0;
  const percent = total ? Math.round(completed / total * 100) : 0;
  const nextTask = tasks.find(task => isPending(task, now) && !isOverdue(task, now)) || tasks.find(task => isPending(task, now));
  const regularTasks = tasks.filter(isRegular);
  const oneOffTasks = tasks.filter(task => !isRegular(task));
  const renderCard = task => <TaskCard
    key={task.id}
    task={task}
    focused={task.id === nextTask?.id}
    showDate={!singleDay}
    now={now}
    pending={pendingIds.has(task.id)}
    onEdit={onEdit}
    onToggle={onToggle}
    onDelete={onDelete}
    onDeleteSeries={onDeleteSeries}
  />;

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
        {/* Uma lista só: habituais e depois pontuais, separadas por subtítulos discretos. */}
        {regularTasks.length > 0 && <section className="list-group" aria-labelledby="group-regular">
          <GroupLabel id="group-regular" title="Habituais" detail={`${regularTasks.filter(task => task.done).length}/${regularTasks.length}`} />
          {regularTasks.map(renderCard)}
        </section>}
        {oneOffTasks.length > 0 && <section className="list-group" aria-labelledby="group-one-off">
          <GroupLabel id="group-one-off" title="Pontuais" detail={`${oneOffTasks.filter(task => task.done).length}/${oneOffTasks.length}`} />
          {oneOffTasks.map(renderCard)}
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
