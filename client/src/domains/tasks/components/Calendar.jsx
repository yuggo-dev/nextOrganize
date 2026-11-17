import { calendarDays, isoDate } from "../model/schedule.js";

const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

export default function Calendar({ month, selected, today, tasks, onMonthChange, onSelect }) {
  const byDay = new Map();
  for (const task of tasks) {
    if (!task.due) continue;
    if (!byDay.has(task.due)) byDay.set(task.due, []);
    byDay.get(task.due).push(task);
  }
  const move = offset => onMonthChange(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  return (
    <section className="calendar-panel panel" aria-label="Calendário de tarefas">
      <div className="calendar-heading">
        <h2>{month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h2>
        <div className="calendar-nav">
          <button type="button" className="icon-button" aria-label="Mês anterior" onClick={() => move(-1)}>‹</button>
          <button type="button" className="today-button" onClick={() => onSelect(today)}>Hoje</button>
          <button type="button" className="icon-button" aria-label="Próximo mês" onClick={() => move(1)}>›</button>
        </div>
      </div>
      <div className="calendar-weekdays">
        {weekdays.map(day => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid">
        {calendarDays(month).map(date => {
          const value = isoDate(date);
          const entries = byDay.get(value) || [];
          const colors = [...new Set(entries.map(task => task.category_color))].slice(0, 4);
          const completed = entries.filter(task => task.done).length;
          const label = date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
          const details = `${entries.length} ${entries.length === 1 ? "tarefa" : "tarefas"}, ${completed} concluídas`;

          return (
            <button
              type="button"
              key={value}
              onClick={() => onSelect(value)}
              className={`calendar-day${entries.length ? " has-tasks" : ""}${date.getMonth() !== month.getMonth() ? " outside" : ""}${value === today ? " is-today" : ""}${value === selected ? " selected" : ""}`}
              aria-pressed={value === selected}
              aria-current={value === today ? "date" : undefined}
              aria-label={`${label}, ${details}`}
              title={`${label}\n${details}`}
            >
              <span className="calendar-cell-heading">
                <span className="day-number">{date.getDate()}</span>
                {entries.length > 0 && (
                  <span className={`day-count${completed === entries.length ? " all-done" : ""}`} aria-hidden="true">
                    {entries.length}
                  </span>
                )}
              </span>
              {entries.length > 0 && (
                <span className={`day-activity-strip${completed === entries.length ? " all-done" : ""}`} aria-hidden="true">
                  {colors.map(color => <i key={color} style={{ background: color }} />)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="calendar-caption">
        <span><i className="legend-today" />Hoje</span>
        <span><i className="legend-activity" />Cor do tipo</span>
      </div>
    </section>
  );
}
