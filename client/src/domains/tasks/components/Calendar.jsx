import { FiChevronLeft, FiChevronRight, FiChevronDown, FiCalendar, FiGrid, FiCheckCircle, FiBookmark } from 'react-icons/fi';
import TypeIcon from '../../task-types/icons.jsx';
import { groupCalendarTypes } from '../model/calendar.js';
import { calendarDays, isoDate } from '../model/schedule.js';
import SelectedDayLine from './SelectedDayLine.jsx';

const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
// Até 3 cards por dia; em dias estreitos o CSS mostra 2 e troca o "+N".
const MAX_CHIPS = 3;

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
  const filtered = Boolean(selectedType);
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
      {filtered ? <span><FiBookmark aria-hidden="true" />Ícones: todas as atividades do tipo, habituais inclusive</span>
        : <><span><FiBookmark aria-hidden="true" />Cards: pontuais na cor do tipo</span>
        <span>Habituais aparecem ao filtrar por tipo</span></>}
    </div>
    <div className="calendar-weekdays">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
    <div className="calendar-grid">
      {calendarDays(month).map(date => {
        const value = isoDate(date);
        // Habituais (diárias e semanais) não aparecem em destaque no calendário:
        // fundo, contagem, conclusão e marcadores consideram só as pontuais. Elas
        // seguem na lista do dia e no Desempenho.
        // Com um tipo escolhido no filtro, o calendário mostra tudo desse tipo,
        // habituais inclusive, com os marcadores de ícone por tipo.
        const habits = filtered ? [] : (byDay.get(value) || []).filter(task => ['daily', 'weekly'].includes(task.recurrence));
        const entries = (byDay.get(value) || []).filter(task => filtered || !['daily', 'weekly'].includes(task.recurrence));
        const markers = filtered ? groupCalendarTypes(entries) : [];
        // Como no calendário da Apple: um card por atividade, primeiro as de dia
        // inteiro (sem horário) e depois por horário; o resto vira "+N mais".
        const agenda = [...entries].sort((a, b) => (a.due_time || '').localeCompare(b.due_time || '') || a.title.localeCompare(b.title, 'pt-BR'));
        const completed = entries.filter(task => task.done).length;
        const allDone = entries.length > 0 && completed === entries.length;
        const label = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
        const details = `${entries.length} ${filtered ? 'atividades' : 'pontuais'}, ${completed} concluídas${habits.length ? `, ${habits.length} habituais` : ''}`;
        const preview = entries.length ? `${filtered ? "Atividades" : "Pontuais"}: ${entries.map(task => task.title).join(', ')}` : '';
        return <button type="button" key={value} onClick={() => onSelect(value)}
          className={`calendar-day${entries.length ? ' has-tasks' : ''}${date.getMonth() !== month.getMonth() ? ' outside' : ''}${value === today ? ' is-today' : ''}${value === selected ? ' selected' : ''}${allDone ? ' day-complete' : ''}`}
          aria-pressed={value === selected} aria-current={value === today ? 'date' : undefined}
          aria-label={`${label}, ${details}`} title={`${label}\n${details}${preview ? '\n'+preview : ''}`}>
          <span className="calendar-cell-heading"><span className="day-number">{date.getDate()}</span>
            {allDone ? <FiCheckCircle className="month-day-done" aria-hidden="true" /> : entries.length > 0 && <span className="day-task-count" aria-hidden="true">{entries.length - completed}</span>}
          </span>
          <span className="month-day-content" aria-hidden="true">
            {filtered ? markers.length > 0 && <span className="month-punctual-row">
              {markers.map(group => <span key={group.id} className={`month-event${group.done ? ' event-done' : ''}`} style={{'--event-color':group.color}}>
                <TypeIcon icon={group.icon} name={group.name} />
                {group.tasks.length > 1 && <b className="month-event-count">{group.tasks.length}</b>}
              </span>)}
            </span> : agenda.length > 0 &&<span className="month-agenda">
              {agenda.slice(0, MAX_CHIPS).map((task, index) => <span key={task.id ?? `${task.title}-${index}`}
                className={`month-chip chip-${index + 1}${task.done ? ' is-done' : ''}${task.due_time ? ' has-time' : ' all-day'}`}
                style={{'--event-color': task.category_color || '#64748b'}}>
                <TypeIcon icon={task.category_icon} name={task.category || 'Sem tipo'} />
                <span className="month-chip-title">{task.title}</span>
                {task.due_time && <span className="month-chip-time">{task.due_time}</span>}
              </span>)}
              {[3, 2].map(shown => agenda.length > shown && <span key={shown} className={`month-chip-more more-${shown}`}>+{agenda.length - shown}<span className="more-word"> mais</span></span>)}
            </span>}
          </span>
        </button>;
      })}
    </div>
    </div>
  </section>;
}
