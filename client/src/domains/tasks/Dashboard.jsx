import { FiPlus, FiTag, FiSliders, FiCalendar, FiLayers, FiCheckSquare, FiSearch, FiSun, FiLogOut, FiHome, FiBarChart2, FiChevronDown, FiFilter } from "react-icons/fi";
import TypeIcon from "../task-types/icons.jsx";
import { useEffect, useRef, useState } from "react";
import { useTasks } from "./hooks/useTasks.js";
import { calendarDays, daysFromToday, isoDate, isOverdue, isPending, relativeDayLabel, sortTasks } from "./model/schedule.js";
import { expandRecurringTasks, recurringStart, shiftDate, scheduledOn } from "./model/recurrence.js";
import Calendar from "./components/Calendar.jsx";
import SelectedDayLine from "./components/SelectedDayLine.jsx";
import TaskDialog from "./components/TaskDialog.jsx";
import TaskList from "./components/TaskList.jsx";
import TypeManager from "../task-types/TypeManager.jsx";
import PerformanceDashboard from "./PerformanceDashboard.jsx";
import { LogoMark } from "../../shared/components/Logo.jsx";

export default function Dashboard({ user, onLogout, loggingOut, sessionError }) {
  const { tasks: records, types, loading, error, setError, addTask, addType, editTask, updateType, toggleTask, deleteTask, deleteSeries } = useTasks();
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(() => isoDate(new Date()));
  const [month, setMonth] = useState(() => new Date());
  const [filter, setFilter] = useState("day");
  const [typeFilter, setTypeFilter] = useState("");
  const [hideDone, setHideDone] = useState(false);
  // Só tem efeito no celular, onde a lista vem primeiro e o calendário começa recolhido.
  const [calendarCollapsed, setCalendarCollapsed] = useState(true);
  // Fechar a aba do calendário no celular: primeiro a animação de descida,
  // depois o estado recolhido. Sem animação (computador ou movimento reduzido)
  // recolhe na hora.
  const [calendarClosing, setCalendarClosing] = useState(false);
  const closeTimer = useRef(null);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  const closeCalendar = () => {
    if (calendarCollapsed || calendarClosing) return;
    const animated = window.matchMedia("(max-width: 760px) and (prefers-reduced-motion: no-preference)").matches;
    if (!animated) { setCalendarCollapsed(true); return; }
    setCalendarClosing(true);
    closeTimer.current = setTimeout(() => { setCalendarCollapsed(true); setCalendarClosing(false); }, 220);
  };
  const toggleCalendar = () => calendarCollapsed ? setCalendarCollapsed(false) : closeCalendar();
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
  const open = tasks.filter(task => isPending(task, now));
  const todayCount = open.filter(task => task.due === today).length;
  const todayTasks = tasks.filter(task => task.due === today);
  const todayCompleted = todayTasks.filter(task => task.done).length;
  const upcoming = open.filter(task => task.due && daysFromToday(task.due, now) > 0 && daysFromToday(task.due, now) <= 7);
  const weekCount = upcoming.length;
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
    if (filter === "open") return isPending(task, now);
    return true;
  }), now);
  const titles = { week: "Próximos 7 dias", open: "Tarefas em aberto" };
  const greeting = now.getHours() < 12 ? "Bom dia" : now.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const firstName = user.name.trim().split(/\s+/)[0];

  return <div className={`app-frame${screen === "home" ? " agenda-frame" : " insights-frame"}`}>
    <aside className="sidebar" aria-label="Navegação principal">
      <LogoMark size={36} title="nextOrganize" className="sidebar-logo" />
      <nav className="sidebar-navigation" aria-label="Telas da aplicação">
        <button type="button" className="sidebar-button" aria-label="Início" title="Início"
          aria-pressed={screen === "home"} onClick={() => setScreen("home")}>
          <FiHome aria-hidden="true" />
        </button>
        <button type="button" className="sidebar-button" aria-label="Desempenho" title="Desempenho"
          aria-pressed={screen === "performance"} onClick={() => setScreen("performance")}>
          <FiBarChart2 aria-hidden="true" />
        </button>
      </nav>
      <div className="sidebar-account">
        <button type="button" className="sidebar-button" onClick={toggleTheme} aria-label="Alternar tema" title="Alternar tema">
          <FiSun aria-hidden="true" />
        </button>
        <button type="button" className="sidebar-button" onClick={onLogout} disabled={loggingOut}
          aria-label={loggingOut ? "Saindo da conta" : "Sair da conta"} title="Sair da conta">
          <FiLogOut aria-hidden="true" />
        </button>
        <span className="account-avatar" title={`${user.name} · ${user.email}`} aria-label={`Conta de ${user.name}`}>
          {firstName.charAt(0).toLocaleUpperCase("pt-BR")}
        </span>
      </div>
    </aside>
    <main className={`dashboard${screen === "home" ? " agenda-dashboard" : " insights-dashboard"}`}>
    {(error || sessionError) && <div className="err" role="alert">{error || sessionError}</div>}
    {screen === "performance" ? <PerformanceDashboard tasks={records} now={now} loading={loading} /> : <>
    <header className="agenda-topbar">
      <div className="brand">
        <div>
          <h1>{greeting}, {firstName}!</h1>
          <p className="topbar-agenda">Sua agenda</p>
          <SelectedDayLine selected={selected} today={today} className="topbar-day-line" />
        </div>
      </div>
      <div className="agenda-actions">
        <details className="agenda-type-menu" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }}>
          <summary aria-label="Tipos" title="Tipos"><FiTag aria-hidden="true" /> <span className="action-label">Tipos</span> <FiChevronDown aria-hidden="true" /></summary>
          <div className="agenda-type-options">
            <button type="button" disabled={loading || !types.length} onClick={event => { event.currentTarget.closest("details").open = false; setDialog("manage-types"); }}><FiSliders aria-hidden="true" /> Personalizar tipos</button>
            <button type="button" disabled={loading} onClick={event => { event.currentTarget.closest("details").open = false; setDialog("type"); }}><FiPlus aria-hidden="true" /> Novo tipo</button>
          </div>
        </details>
        <button type="button" className="main" disabled={loading} aria-label="Nova tarefa" title="Nova tarefa" onClick={() => setDialog("task")}><FiPlus aria-hidden="true" /> <span className="action-label">Nova tarefa</span></button>
      </div>
    </header>

    <div className="workspace agenda-workspace">
      <div className="agenda-toolbar">
        <nav className="agenda-views" aria-label="Visualizações da agenda">
          <button type="button" aria-pressed={filter === "day" && selected === today} onClick={() => selectDay(today)} title={`${todayCount} pendentes hoje; ${todayCompleted} de ${todayTasks.length} concluídas`}>
            <FiCalendar aria-hidden="true" /><span>Hoje</span><b>{todayCount}</b><small>{todayCompleted}/{todayTasks.length} feitas</small>
          </button>
          <button type="button" aria-pressed={filter === "week"} onClick={() => setFilter("week")} title="Tarefas pendentes dos próximos sete dias">
            <FiLayers aria-hidden="true" /><span>7 dias</span><b>{weekCount}</b>
          </button>
          <button type="button" aria-pressed={filter === "open"} onClick={() => setFilter("open")} title={`${open.length} em aberto, incluindo ${overdueCount} atrasadas. Repetições até os próximos sete dias.`}>
            <FiCheckSquare aria-hidden="true" /><span>Em aberto</span><b>{open.length}</b>{overdueCount > 0 && <small className="agenda-late-count">{overdueCount} atrasadas</small>}
          </button>
        </nav>
        <label className="search-field">
          <FiSearch className="search-action-icon" aria-hidden="true" />
          <input type="search" aria-label="Buscar atividades" placeholder="Buscar na agenda…" value={search} onChange={event => setSearch(event.target.value)} />
        </label>
      </div>
      <Calendar types={types} selectedType={typeFilter} onTypeFilter={setTypeFilter}
        collapsed={calendarCollapsed} closing={calendarClosing} onToggleCollapsed={toggleCalendar} month={month} selected={selected} today={today} tasks={calendarTasks.filter(matchesFilters)} onMonthChange={setMonth}
        onSelect={value => { selectDay(value); closeCalendar(); }} />
      {/* No celular o calendário abre como uma aba sobre a lista; tocar fora fecha. */}
      {!calendarCollapsed && <button type="button" className={`calendar-scrim${calendarClosing ? " is-closing" : ""}`} aria-label="Fechar calendário" tabIndex={-1} onClick={closeCalendar} />}
      <section className="day-panel panel" aria-label="Lista de tarefas">
        <div className="day-heading">
          <div>
            <h2>{filter !== "day" ? titles[filter] : { Hoje: "Programação de hoje", Amanhã: "Programação de amanhã", Ontem: "Programação de ontem" }[relativeDayLabel(selected, now)] || "Programação do dia"}</h2>
            {/* A data por extenso do dia selecionado fica no cabeçalho do calendário,
                que acompanha a lista; aqui só o atalho de volta quando não é hoje. */}
            {filter !== "day" ? <p>Suas atividades</p> : selected !== today && <p className="day-heading-date">
              <button type="button" className="back-to-today" onClick={() => selectDay(today)}>Voltar para hoje</button>
            </p>}
          </div>
          <span className="task-count">{visible.length}</span>
        </div>
        <div className="list-filters">{/* Filtro por tipo da lista: só no celular; no computador os tipos ficam no topo do calendário. */}<div className={`type-filter-control${typeFilter ? " is-active" : ""}`}>{typeFilter ? <TypeIcon icon={types.find(type => String(type.id) === typeFilter)?.icon} name={types.find(type => String(type.id) === typeFilter)?.name} /> : <FiFilter aria-hidden="true" />}<select aria-label="Filtrar por tipo" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
          <option value="">Todos os tipos</option>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select></div><label><input type="checkbox" checked={hideDone} onChange={event => setHideDone(event.target.checked)} />Ocultar concluídas</label></div>
        <TaskList progressTasks={filter === "day" ? expandRecurringTasks(records, selected, selected, now).filter(task => task.due === selected &&
          (!typeFilter || String(task.type_id) === typeFilter) && (!query || `${task.title} ${task.category}`.toLocaleLowerCase("pt-BR").includes(query))) : undefined} tasks={visible} now={now} loading={loading} searching={!!query} singleDay={filter === "day"}
          viewKey={`${selected}:${filter}:${typeFilter}:${hideDone}:${query}`}
          onEdit={task => { const record = records.find(item => item.id === (task.source_id || task.id)); if (record) setDialog({ task: record, occurrenceDate: task.due }); }}
          pendingIds={pendingIds} onToggle={task => act(task, toggleTask)} onDelete={task => act(task, deleteTask)}
          onDeleteSeries={task => act(task, deleteSeries)} onAdd={() => setDialog("task")} />
      </section>
    </div>
    </>}
    {dialog === "manage-types" && <TypeManager types={types} onSave={updateType} onClose={() => setDialog(null)} />}
    {dialog && dialog !== "manage-types" && <TaskDialog key={dialog.task?.id || dialog} task={dialog.task} selected={selected} types={types} typesOnly={dialog === "type"} onClose={() => setDialog(null)}
      onCreateType={addType} onSave={async form => {
        const task = dialog.task ? await editTask(dialog.task.id, form) : await addTask(form);
        let date = task.due;
        if (dialog.task && task.due === dialog.task.due && dialog.occurrenceDate >= task.due && (!task.recurrence_until || dialog.occurrenceDate <= task.recurrence_until) && scheduledOn(task, dialog.occurrenceDate)) date = dialog.occurrenceDate;
        if (date && task.recurrence === "weekly") while (!scheduledOn(task, date)) date = shiftDate(date, 1);
        if (date) selectDay(date);
        if (dialog.task) { setTypeFilter(""); setSearch(""); setHideDone(false); }
      }} />}
    </main>
  </div>;
}
