import { useState } from 'react';
import { FiActivity, FiTrendingUp, FiCheckCircle, FiClock, FiAlertCircle, FiCalendar, FiLayers, FiFlag, FiChevronLeft, FiChevronRight, FiTarget } from 'react-icons/fi';
import TypeIcon from '../task-types/icons.jsx';
import { buildPerformance } from './model/performance.js';

function Metric({Icon,label,value,detail,tone,progress,total}) {
  return <article className={`insight-metric metric-${tone}`}>
    <span className="insight-metric-icon"><Icon aria-hidden="true" /></span>
    <div className="insight-metric-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    <progress value={progress} max={Math.max(1,total)} aria-label={`${label}: ${progress} de ${total} atividades`} />
  </article>;
}

export default function PerformanceDashboard({ tasks, now, loading }) {
  const [period, setPeriod] = useState('all');
  const [typePage, setTypePage] = useState(0);
  const data = buildPerformance(tasks, now, period);
  const pageCount = Math.max(1, Math.ceil(data.types.length / 4));
  const currentPage = Math.min(typePage, pageCount - 1);
  const groups = data.types.slice(currentPage * 4, currentPage * 4 + 4);
  const completedAngle = data.total ? data.completed / data.total * 360 : 0;
  const scheduledAngle = data.total ? data.scheduled / data.total * 360 : 0;
  const chartMax = Math.max(1, ...data.days.map(day => day.total));
  const rate = data.total ? `${data.completionRate}%` : '—';

  return <section className="performance-view insights-view" aria-label="Dashboard de desempenho" aria-busy={loading}>
    <header className="insights-header">
      <div className="insights-identity"><span className="insights-header-icon"><FiActivity aria-hidden="true" /></span><div><span className="insights-eyebrow">SEU RITMO EM PERSPECTIVA</span><h1>Desempenho</h1><p>Seu progresso, tema por tema.</p></div></div>
      <label className="insights-period"><FiCalendar aria-hidden="true" /><span>Período por prazo<select value={period} onChange={event=>{setPeriod(event.target.value);setTypePage(0);}}><option value="all">Todo o histórico</option><option value="month">Este mês</option><option value="week">Últimos 7 dias</option></select></span></label>
    </header>

    {loading ? <div className="empty-state" role="status">Carregando indicadores…</div> : <>
      <div className="insights-metrics">
        <Metric Icon={FiTrendingUp} label="Taxa de conclusão" value={rate} detail={`${data.total} atividades no período`} tone="rate" progress={data.completed} total={data.total} />
        <Metric Icon={FiCheckCircle} label="Concluídas" value={data.completed} detail="Cada conclusão é um passo" tone="completed" progress={data.completed} total={data.total} />
        <Metric Icon={FiClock} label="Em aberto" value={data.open} detail={`${data.scheduled} sem atraso`} tone="open" progress={data.open} total={data.total} />
        <Metric Icon={FiAlertCircle} label="Atrasadas" value={data.overdue} detail={data.overdue ? 'Você pode reorganizar os prazos' : 'Nenhuma pendência atrasada'} tone="overdue" progress={data.overdue} total={data.total} />
      </div>

      <div className="performance-grid insights-grid">
        <section className="performance-panel insight-panel insight-overview" aria-labelledby="completion-title">
          <div className="insight-panel-heading"><span className="insight-section-icon"><FiTarget aria-hidden="true" /></span><div><h2 id="completion-title">Visão das atividades</h2><p>Seu ponto de partida para o próximo passo</p></div></div>
          <div className="completion-content">
            <div className="completion-ring" role="img" aria-label={`${data.completed} concluídas, ${data.scheduled} abertas sem atraso e ${data.overdue} atrasadas`}
              style={{ background: data.total ? `conic-gradient(var(--success) 0deg ${completedAngle}deg, var(--accent) ${completedAngle}deg ${completedAngle + scheduledAngle}deg, var(--overdue) ${completedAngle + scheduledAngle}deg 360deg)` : 'var(--line)' }}>
              <div><strong>{rate}</strong><span>{data.total ? 'concluídas' : 'Sem atividades'}</span></div>
            </div>
            <div className="insight-status-list">
              {[{label:'Concluídas',value:data.completed,Icon:FiCheckCircle,tone:'completed'},{label:'Sem atraso',value:data.scheduled,Icon:FiClock,tone:'open'},{label:'Atrasadas',value:data.overdue,Icon:FiAlertCircle,tone:'overdue'}].map(item=><div key={item.tone} className={`insight-status metric-${item.tone}`}><item.Icon aria-hidden="true" /><span>{item.label}</span><strong>{item.value}</strong></div>)}
            </div>
          </div>
          <p className="insight-note"><FiActivity aria-hidden="true" />{!data.total ? 'Suas atividades aparecerão aqui assim que você começar.' : data.completed === data.total ? 'Tudo concluído neste período. Boa conquista!' : `${data.completed} concluídas. Continue no seu ritmo.`}</p>
        </section>

        <section className="performance-panel insight-panel insight-types" aria-labelledby="types-performance-title">
          <div className="insight-panel-heading"><span className="insight-section-icon"><FiLayers aria-hidden="true" /></span><div><h2 id="types-performance-title">Seu progresso por tema</h2><p>Os ícones e as cores dos seus tipos</p></div><span className="insight-count">{data.types.length} tipos</span></div>
          <div className="insight-type-list">
            {groups.length ? groups.map(group=><div className="insight-type-row" key={group.id} style={{'--theme-color':group.color}}>
              <span className="insight-type-icon"><TypeIcon icon={group.icon} name={group.name} /></span>
              <div className="insight-type-body"><div><strong title={group.name}>{group.name}</strong><span>{group.completed}/{group.total} <small>concluídas</small></span></div><progress value={group.completed} max={group.total} style={{'--progress-color':group.color}} aria-label={`${group.name}, ${group.completed} de ${group.total} concluídas`} /></div>
              <b className="insight-type-rate">{Math.round(group.completed/group.total*100)}%</b>
            </div>) : <div className="insight-empty"><FiLayers aria-hidden="true" /><p>Nenhuma atividade neste período.</p><span>Escolha outro período para ver seus temas.</span></div>}
          </div>
          {pageCount>1 && <div className="performance-pagination"><button type="button" aria-label="Tipos anteriores" disabled={currentPage===0} onClick={()=>setTypePage(currentPage-1)}><FiChevronLeft aria-hidden="true" /></button><span>{currentPage+1} / {pageCount}</span><button type="button" aria-label="Próximos tipos" disabled={currentPage===pageCount-1} onClick={()=>setTypePage(currentPage+1)}><FiChevronRight aria-hidden="true" /></button></div>}
        </section>

        <section className="performance-panel insight-panel insight-week" aria-labelledby="week-performance-title">
          <div className="insight-panel-heading"><span className="insight-section-icon"><FiCalendar aria-hidden="true" /></span><div><h2 id="week-performance-title">Prazos nos últimos 7 dias</h2><p>Atividades agrupadas pela data de prazo</p></div></div>
          <div className="chart-legend"><span><i className="status-dot status-completed" />Concluídas</span><span><i className="status-dot status-scheduled" />Abertas</span></div>
          <div className="weekly-chart">
            {data.days.map(day=><div className="weekly-column" key={day.due} role="img" aria-label={`${day.date.toLocaleDateString('pt-BR')}, ${day.total} atividades com prazo, ${day.completed} concluídas`}>
              <div className="weekly-bar-space" title={`${day.total} atividades · ${day.completed} concluídas`}><span className="weekly-total">{day.total}</span><div className="weekly-bar" style={{height:`${day.total/chartMax*100}%`}}><span style={{height:`${day.total?day.completed/day.total*100:0}%`}} /></div></div>
              <span className="weekly-day">{day.date.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')}</span><span className="insight-chart-date">{day.date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>
            </div>)}
          </div>
        </section>

        <section className="performance-panel insight-panel insight-priorities" aria-labelledby="priority-performance-title">
          <div className="insight-panel-heading"><span className="insight-section-icon"><FiFlag aria-hidden="true" /></span><div><h2 id="priority-performance-title">Foco por prioridade</h2><p>Concluídas em relação ao total do período</p></div></div>
          <div className="insight-priority-list">
            {data.priorities.map(priority=><div className={`insight-priority-row insight-priority-${priority.id}`} key={priority.id}>
              <span className="insight-priority-icon"><FiFlag aria-hidden="true" /></span><div><div className="insight-priority-label"><strong>{priority.name}</strong><span>{priority.completed}/{priority.total}</span></div><progress value={priority.completed} max={Math.max(1,priority.total)} aria-label={`Prioridade ${priority.name.toLowerCase()}, ${priority.completed} de ${priority.total} concluídas`} /></div>
            </div>)}
          </div>
        </section>
      </div>
    </>}
  </section>;
}
