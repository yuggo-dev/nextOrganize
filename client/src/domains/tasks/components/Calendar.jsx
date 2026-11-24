import { FiChevronLeft, FiChevronRight, FiChevronDown, FiCalendar, FiGrid, FiCheckCircle, FiBookmark } from 'react-icons/fi';
import TypeIcon from '../../task-types/icons.jsx';
import { groupCalendarTypes } from '../model/calendar.js';
import { calendarDays, isoDate } from '../model/schedule.js';
import SelectedDayLine from './SelectedDayLine.jsx';

const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// collapsed/onToggleCollapsed: no celular o calendário é uma aba presa ao pé da
// tela (só o cabeçalho do mês) que se abre por cima da lista. No computador o
// botão fica oculto e o calendário, sempre aberto.
export default function Calendar({ month, selected, today, tasks, onMonthChange, onSelect, types = [], selectedType = '', onTypeFilter, collapsed = false, closing = false, onToggleCollapsed }) {
  const byDay = new Map();
  for (const task of tasks) {
    if (!task.due) continue;
    if (!byDay.has(task.due)) byDay.set(task.due, []);
    byDay.get(task.due).push(task);
  }
  const longMonth = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const monthLabel = longMonth.charAt(0).toLocaleUpperCase('pt-BR') + longMonth.slice(1);
  const move = offset => onMonthChange(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  return <section className={`calendar-panel panel month-calendar${collapsed ? ' is-collapsed' : ''}${closing ? ' is-closing' : ''}`} aria-label="Calendário de tarefas">
    {onToggleCollapsed && <button type="button" className="calendar-grip" tabIndex={-1} aria-hidden="true" onClick={onToggleCollapsed}><span /></button>}
    <div className="calendar-heading">
      <div className="calendar-title" onClick={collapsed ? onToggleCollapsed : undefined}>
        <h2>{monthLabel}</h2>
        <SelectedDayLine selected={selected} today={today} />
      </div>
      <div className="calendar-nav">
        <button type="button" className="icon-button" aria-label="Mês anterior" onClick={() => move(-1)}><FiChevronLeft aria-hidden="true" /></button>
        <button type="button" className="today-button" onClick={() => onSelect(today)}><FiCalendar aria-hidden="true" /> Hoje</button>
        <button type="button" className="icon-button" aria-label="Próximo mês" onClick={() => move(1)}><FiChevronRight aria-hidden="true" /></button>
        {onToggleCollapsed && <button type="button" className="icon-button calendar-collapse" aria-expanded={!collapsed} aria-controls="calendar-body"
          aria-label={collapsed ? 'Mostrar calendário' : 'Recolher calendário'} title={collapsed ? 'Mostrar calendário' : 'Recolher calendário'} onClick={onToggleCollapsed}>
          <FiCalendar className="collapse-calendar-icon" aria-hidden="true" /><span className="collapse-label">Ver mês</span><FiChevronDown className="collapse-chevron" aria-hidden="true" />
        </button>}
      </div>
    </div>
    {types.length > 0 && onTypeFilter && <div className="calendar-type-key" role="group" aria-label="Filtrar agenda por tema">
      <button type="button" className="calendar-theme calendar-theme-all" aria-pressed={!selectedType} onClick={() => onTypeFilter('')}><FiGrid aria-hidden="true" /><span>Todos</span></button>
      <span className="calendar-type-divider" aria-hidden="true" />
      {types.map(type => <button key={type.id} type="button" className="calendar-theme" style={{'--theme-color':type.color}} aria-pressed={selectedType === String(type.id)} onClick={() => onTypeFilter(selectedType === String(type.id) ? '' : String(type.id))} title={type.name}><TypeIcon icon={type.icon} name={type.name} /><span>{type.name}</span></button>)}
    </div>}
    <div className="calendar-body" id="calendar-body">
    <div className="month-legend" aria-label="Legenda do calendário">
      <span><FiBookmark aria-hidden="true" />Ícone: pontual</span>
      <span><i className="month-regular-legend" aria-hidden="true" />Card leve: regulares</span>
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
          <span className="calendar-cell-heading"><span className="day-number">{date.getDate()}</span>
            {allDone ? <FiCheckCircle className="month-day-done" aria-hidden="true" /> : entries.length > 0 && <span className="day-task-count" aria-hidden="true">{entries.length - completed}</span>}
          </span>
          <span className="month-day-content" aria-hidden="true">
            {punctual.length > 0 && <span className="month-punctual-row">
              {punctualTypes.map(group => <span key={group.id} title={`${group.name}: ${group.tasks.filter(task=>task.done).length}/${group.tasks.length} concluídas
${group.tasks.map(task=>task.title).join(', ')}`} className={`month-event${group.done ? ' event-done' : ''}`} style={{'--event-color':group.color}}>
                <TypeIcon icon={group.icon} name={group.name} />
                {group.tasks.length > 1 && <b className="month-event-count">{group.tasks.length}</b>}
              </span>)}
            </span>}
            {/* Regulares: um mini card leve por tipo, como os cards da lista (fundo
                claro na cor do tipo, faixa à esquerda e o ícone), sem título.
                Fica apagado quando todas do tipo foram concluídas no dia. */}
            {regular.length > 0 && <span className="month-routines">
              <span className="month-routine-cards">
                {/* Quantos cabem depende da largura do dia (CSS por container):
                    4, 2 ou 1, com "+N" para o restante. */}
                {regularTypes.slice(0, 4).map((group, index) =>
                  <span key={group.id} className={`month-routine-card rc-${index}${group.done ? ' routine-done' : ''}`} style={{'--event-color':group.color}}
                    title={`${group.name}: ${group.tasks.length - group.pending}/${group.tasks.length} concluídas`}>
                    <TypeIcon icon={group.icon} name={group.name} />
                  </span>
                )}
                {regularTypes.length > 4 && <span className="month-routine-more more-4">+{regularTypes.length - 4}</span>}
                {regularTypes.length > 2 && <span className="month-routine-more more-2">+{regularTypes.length - 2}</span>}
                {regularTypes.length > 1 && <span className="month-routine-more more-1">+{regularTypes.length - 1}</span>}
              </span>
            </span>}
          </span>
        </button>;
      })}
    </div>
    </div>
  </section>;
}
