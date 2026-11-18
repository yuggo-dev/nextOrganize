import { FiChevronLeft, FiChevronRight, FiCalendar, FiLayers, FiCheckCircle, FiBookmark } from 'react-icons/fi';
import TypeIcon from '../../task-types/icons.jsx';
import { groupCalendarTypes } from '../model/calendar.js';
import { calendarDays, isoDate } from '../model/schedule.js';

const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export default function Calendar({ month, selected, today, tasks, onMonthChange, onSelect, types = [], selectedType = '', onTypeFilter }) {
  const byDay = new Map();
  for (const task of tasks) {
    if (!task.due) continue;
    if (!byDay.has(task.due)) byDay.set(task.due, []);
    byDay.get(task.due).push(task);
  }
  const move = offset => onMonthChange(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  return <section className="calendar-panel panel month-calendar" aria-label="Calendário de tarefas">
    <div className="calendar-heading">
      <h2>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
      <div className="calendar-nav">
        <button type="button" className="icon-button" aria-label="Mês anterior" onClick={() => move(-1)}><FiChevronLeft aria-hidden="true" /></button>
        <button type="button" className="today-button" onClick={() => onSelect(today)}><FiCalendar aria-hidden="true" /> Hoje</button>
        <button type="button" className="icon-button" aria-label="Próximo mês" onClick={() => move(1)}><FiChevronRight aria-hidden="true" /></button>
      </div>
    </div>
    <div className="month-legend" aria-label="Legenda do calendário">
      <span><FiBookmark aria-hidden="true" />Ícone: pontual</span>
      <span><i className="month-regular-legend" aria-hidden="true" />Pontos: regulares</span>
    </div>
    <div className="calendar-weekdays">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid">
      {calendarDays(month).map(date => {
        const value = isoDate(date);
        const entries = byDay.get(value) || [];
        const regular = entries.filter(task => ['daily', 'weekly'].includes(task.recurrence));
        const punctual = entries.filter(task => !['daily', 'weekly'].includes(task.recurrence));
        const punctualTypes = groupCalendarTypes(punctual);
        const regularTypes = groupCalendarTypes(regular);
        const completed = entries.filter(task => task.done).length;
        const allDone = entries.length > 0 && completed === entries.length;
        const label = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        const details = `${punctual.length} pontuais, ${regular.length} regulares, ${completed} de ${entries.length} concluídas`;
        const preview = [punctual.length ? `Pontuais: ${punctual.map(task => task.title).join(', ')}` : '', regular.length ? `Regulares: ${regular.map(task => task.title).join(', ')}` : ''].filter(Boolean).join('\n');
        return <button type="button" key={value} onClick={() => onSelect(value)}
          className={`calendar-day${entries.length ? ' has-tasks' : ''}${date.getMonth() !== month.getMonth() ? ' outside' : ''}${value === today ? ' is-today' : ''}${value === selected ? ' selected' : ''}${allDone ? ' day-complete' : ''}`}
          aria-pressed={value === selected} aria-current={value === today ? 'date' : undefined}
          aria-label={`${label}, ${details}`} title={`${label}\n${details}${preview ? '\n'+preview : ''}`}>
          <span className="calendar-cell-heading"><span className="day-number">{date.getDate()}</span>{allDone && <FiCheckCircle className="month-day-done" aria-hidden="true" />}</span>
          <span className="month-day-content" aria-hidden="true">
            {punctual.length > 0 && <span className="month-punctual-row">
              {punctualTypes.map(group => <span key={group.id} title={`${group.name}: ${group.tasks.filter(task=>task.done).length}/${group.tasks.length} concluídas
${group.tasks.map(task=>task.title).join(', ')}`} className={`month-event${group.done ? ' event-done' : ''}`} style={{'--event-color':group.color}}>
                <TypeIcon icon={group.icon} name={group.name} />
              </span>)}
            </span>}
            {regular.length > 0 && <span className="month-routines">
              <span className="month-routine-dots">{regularTypes.slice(0,4).map(group =>
                <span key={group.id} className={`month-routine${group.done ? ' routine-done' : ''}`} style={{'--event-color':group.color}} />
              )}</span>
            </span>}
          </span>
        </button>;
      })}
    </div>
    {types.length > 0 && onTypeFilter && <div className="calendar-type-key" role="group" aria-label="Filtrar agenda por tema">
      <button type="button" className="calendar-theme" aria-pressed={!selectedType} onClick={() => onTypeFilter('')}><FiLayers aria-hidden="true" /><span>Todos</span></button>
      {types.map(type => <button key={type.id} type="button" className="calendar-theme" style={{'--theme-color':type.color}} aria-pressed={selectedType === String(type.id)} onClick={() => onTypeFilter(selectedType === String(type.id) ? '' : String(type.id))} title={type.name}><TypeIcon icon={type.icon} name={type.name} /><span>{type.name}</span></button>)}
    </div>}
  </section>;
}
