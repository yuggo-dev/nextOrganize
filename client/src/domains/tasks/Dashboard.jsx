import { useEffect, useState } from "react";
import { useTasks } from "./hooks/useTasks.js";
import { calendarDays, daysFromToday, isoDate, isOverdue, sortTasks } from "./model/schedule.js";
import { expandRecurringTasks, recurringStart, shiftDate } from "./model/recurrence.js";
import Calendar from "./components/Calendar.jsx";
import TaskDialog from "./components/TaskDialog.jsx";
import TaskList from "./components/TaskList.jsx";
import PerformanceDashboard from "./PerformanceDashboard.jsx";

export default function Dashboard({ user, onLogout, loggingOut, sessionError }) {
  const { tasks: records, types, loading, error, setError, addTask, addType, toggleTask, deleteTask, deleteSeries } = useTasks();
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(() => isoDate(new Date()));
  const [month, setMonth] = useState(() => new Date());
  const [filter, setFilter] = useState("day");
  const [typeFilter, setTypeFilter] = useState("");
  const [hideDone, setHideDone] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [pendingIds, setPendingIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [screen, setScreen] = useState("home");
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  const today = isoDate(now);
  const tasks = expandRecurringTasks(records, recurringStart(records, today), shiftDate(today, 7), now);
  const calendarDates = calendarDays(month);
  const calendarTasks = expandRecurringTasks(records, isoDate(calendarDates[0]), isoDate(calendarDates.at(-1)), now);
  const open = tasks.filter(task => !task.done);
  const todayCount = open.filter(task => task.due === today).length;
  const todayTasks = tasks.filter(task => task.due === today);
  const todayCompleted = todayTasks.filter(task => task.done).length;
  const upcoming = open.filter(task => task.due && daysFromToday(task.due, now) > 0 && daysFromToday(task.due, now) <= 7);
  const weekCount = upcoming.length;
  const upcomingDays = Array.from({ length: 7 }, (_, index) => {
    const due = shiftDate(today, index + 1);
    return { due, count: upcoming.filter(task => task.due === due).length };
  });
  const busyDays = upcomingDays.filter(day => day.count > 0).length;
  const overdueCount = open.filter(task => isOverdue(task, now)).length;

  const selectDay = date => {
    setSelected(date);
    const [year, month, day] = date.split("-").map(Number);
    setMonth(new Date(year, month - 1, day));
    setFilter("day");
  };

  const act = async (task, action) => {
    setError("");
    setPendingIds(current => new Set(current).add(task.id));
    try { await action(task); }
    catch (error) { setError(error.message); }
    finally { setPendingIds(current => { const next = new Set(current); next.delete(task.id); return next; }); }
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
  };

  const query = search.trim().toLocaleLowerCase("pt-BR");
  const matchesFilters = task =>
    (!typeFilter || String(task.type_id) === typeFilter) &&
    (!hideDone || !task.done) &&
    (!query || `${task.title} ${task.category}`.toLocaleLowerCase("pt-BR").includes(query));
  const matching = tasks.filter(matchesFilters);
  const source = filter === "day" ? expandRecurringTasks(records, selected, selected, now).filter(matchesFilters) : matching;
  const visible = sortTasks(source.filter(task => {
    if (filter === "day") return task.due === selected;
    if (filter === "week") return task.due && daysFromToday(task.due, now) > 0 && daysFromToday(task.due, now) <= 7 && !task.done;
    if (filter === "open") return !task.done;
    return true;
  }), now);
  const [year, selectedMonth, day] = selected.split("-").map(Number);
  const selectedDate = new Date(year, selectedMonth - 1, day);
  const titles = { week: "Próximos 7 dias", open: "Tarefas em aberto" };
  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user.name.trim().split(/\s+/)[0];

  return <div className="app-frame">
    <aside className="sidebar" aria-label="Navegação principal">
      <nav className="sidebar-navigation" aria-label="Telas da aplicação">
        <button type="button" className="sidebar-button" aria-label="Início" title="Início"
          aria-pressed={screen === "home"} onClick={() => setScreen("home")}>
          <i className="nav-home" aria-hidden="true" />
        </button>
        <button type="button" className="sidebar-button" aria-label="Desempenho" title="Desempenho"
          aria-pressed={screen === "performance"} onClick={() => setScreen("performance")}>
          <i className="nav-chart" aria-hidden="true"><i /><i /><i /></i>
        </button>
      </nav>
      <div className="sidebar-account">
        <button type="button" className="sidebar-button" onClick={toggleTheme} aria-label="Alternar tema" title="Alternar tema">
          <span aria-hidden="true">◐</span>
        </button>
        <button type="button" className="sidebar-button" onClick={onLogout} disabled={loggingOut}
          aria-label={loggingOut ? "Saindo da conta" : "Sair da conta"} title="Sair da conta">
          <span aria-hidden="true">↪</span>
        </button>
        <span className="account-avatar" title={`${user.name} · ${user.email}`} aria-label={`Conta de ${user.name}`}>
          {firstName.charAt(0).toLocaleUpperCase("pt-BR")}
        </span>
      </div>
    </aside>
    <main className="dashboard">
    {(error || sessionError) && <div className="err" role="alert">{error || sessionError}</div>}
    {screen === "performance" ? <PerformanceDashboard tasks={records} now={now} loading={loading} /> : <>
    <header className="dashboard-header">
      <div className="brand">
        <div>
          <h1>{greeting}, {firstName}!</h1>
          <p>{now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </div>
      <label className="search-field">
        <i className="search-icon" aria-hidden="true" />
        <input type="search" aria-label="Buscar atividades" placeholder="Buscar atividades"
          value={search} onChange={event => setSearch(event.target.value)} />
      </label>
    </header>

    <section className="stats" aria-label="Resumo das tarefas">
      <button type="button" className="stat stat-today" onClick={() => selectDay(today)}>
        <span className="stat-heading"><span>Para hoje</span><span className="stat-icon" aria-hidden="true">◷</span></span>
        <span className="stat-value"><b>{todayCount}</b><span>pendentes</span><span className="stat-arrow" aria-hidden="true">↗</span></span>
        <span className="stat-footer">
          <small>{todayCompleted} de {todayTasks.length} concluídas</small>
          <progress value={todayCompleted} max={Math.max(1, todayTasks.length)} aria-label={`${todayCompleted} de ${todayTasks.length} tarefas de hoje concluídas`} />
        </span>
      </button>
      <button type="button" className="stat stat-week" onClick={() => setFilter("week")}>
        <span className="stat-heading"><span>Próximos 7 dias</span><span className="stat-icon" aria-hidden="true">▦</span></span>
        <span className="stat-value"><b>{weekCount}</b><span>programadas</span><span className="stat-arrow" aria-hidden="true">↗</span></span>
        <span className="stat-footer">
          <small>{busyDays} {busyDays === 1 ? "dia com atividades" : "dias com atividades"}</small>
          <span className="stat-week-markers" aria-hidden="true">
            {upcomingDays.map(day => <i key={day.due} className={day.count ? "has-activities" : ""}
              title={`${day.due.split("-").reverse().slice(0, 2).join("/")}: ${day.count} pendentes`} />)}
          </span>
        </span>
      </button>
      <button type="button" className="stat stat-open" title="Tarefas avulsas e repetições diárias até os próximos 7 dias" onClick={() => setFilter("open")}>
        <span className="stat-heading"><span>Em aberto</span><span className="stat-icon" aria-hidden="true">☷</span></span>
        <span className="stat-value"><b>{open.length}</b><span>atividades</span><span className="stat-arrow" aria-hidden="true">↗</span></span>
        <span className="stat-footer">
          <small>{overdueCount ? `${overdueCount} ${overdueCount === 1 ? "atrasada" : "atrasadas"}` : "Nenhuma atrasada"}</small>
          <progress value={overdueCount} max={Math.max(1, open.length)} aria-label={`${overdueCount} de ${open.length} tarefas abertas estão atrasadas`} />
        </span>
      </button>
    </section>

    <div className="workspace-heading"><h2>Sua agenda</h2><div>
      <button type="button" disabled={loading} onClick={() => setDialog("type")}>+ Novo tipo</button>
      <button type="button" className="main" disabled={loading} onClick={() => setDialog("task")}>+ Nova tarefa</button>
    </div></div>

    <div className="workspace">
      <Calendar month={month} selected={selected} today={today} tasks={calendarTasks.filter(matchesFilters)} onMonthChange={setMonth} onSelect={selectDay} />
      <section className="day-panel panel" aria-label="Lista de tarefas">
        <div className="day-heading">
          <div>
            <h2>{filter === "day" ? "Programação do dia" : titles[filter]}</h2>
            <p>{filter === "day" ? selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "Suas atividades"}</p>
          </div>
          <span className="task-count">{visible.length}</span>
        </div>
        <div className="list-filters"><select aria-label="Filtrar por tipo" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
          <option value="">Todos os tipos</option>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select><label><input type="checkbox" checked={hideDone} onChange={event => setHideDone(event.target.checked)} />Ocultar concluídas</label></div>
        <TaskList tasks={visible} now={now} loading={loading} searching={!!query}
          viewKey={`${selected}:${filter}:${typeFilter}:${hideDone}:${query}`}
          pendingIds={pendingIds} onToggle={task => act(task, toggleTask)} onDelete={task => act(task, deleteTask)}
          onDeleteSeries={task => act(task, deleteSeries)} onAdd={() => setDialog("task")} />
      </section>
    </div>
    </>}
    {dialog && <TaskDialog selected={selected} types={types} typesOnly={dialog === "type"} onClose={() => setDialog(null)}
      onCreateType={addType} onSave={async form => { const task = await addTask(form); selectDay(task.due); }} />}
    </main>
  </div>;
}
