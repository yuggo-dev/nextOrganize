import { useState } from "react";
import { buildPerformance } from "./model/performance.js";

export default function PerformanceDashboard({ tasks, now, loading }) {
  const [period, setPeriod] = useState("all");
  const [typePage, setTypePage] = useState(0);
  const data = buildPerformance(tasks, now, period);
  const pageCount = Math.max(1, Math.ceil(data.types.length / 4));
  const currentPage = Math.min(typePage, pageCount - 1);
  const groups = data.types.slice(currentPage * 4, currentPage * 4 + 4);
  const completedAngle = data.total ? data.completed / data.total * 360 : 0;
  const scheduledAngle = data.total ? data.scheduled / data.total * 360 : 0;
  const chartMax = Math.max(1, ...data.days.map(day => day.total));
  const rate = data.total ? `${data.completionRate}%` : "—";

  return <section className="performance-view" aria-label="Dashboard de desempenho" aria-busy={loading}>
    <header className="dashboard-header">
      <div className="brand">
        <div>
          <h1>Desempenho</h1>
          <p>Conclusão e pendências das suas atividades</p>
        </div>
      </div>
      <label className="performance-period">Período por prazo
        <select value={period} onChange={event => { setPeriod(event.target.value); setTypePage(0); }}>
          <option value="all">Todo o histórico</option>
          <option value="month">Este mês</option>
          <option value="week">Últimos 7 dias</option>
        </select>
      </label>
    </header>

    {loading ? <div className="empty-state" role="status">Carregando indicadores…</div> : <>
      <div className="performance-stats">
        <div className="performance-stat"><span>Taxa de conclusão</span><b>{rate}</b><small>{data.total} atividades no período</small></div>
        <div className="performance-stat metric-completed"><span>Concluídas</span><b>{data.completed}</b><small>Finalizadas na sua lista</small></div>
        <div className="performance-stat"><span>Em aberto</span><b>{data.open}</b><small>{data.scheduled} sem atraso</small></div>
        <div className="performance-stat metric-overdue"><span>Atrasadas</span><b>{data.overdue}</b><small>Pendências após o prazo</small></div>
      </div>

      <div className="performance-grid">
        <section className="performance-panel completion-panel" aria-labelledby="completion-title">
          <h2 id="completion-title">Visão das atividades</h2>
          <div className="completion-content">
            <div className="completion-ring" role="img" aria-label={`${data.completed} concluídas, ${data.scheduled} abertas sem atraso e ${data.overdue} atrasadas`}
              style={{ background: data.total ? `conic-gradient(var(--success) 0deg ${completedAngle}deg, var(--accent) ${completedAngle}deg ${completedAngle + scheduledAngle}deg, var(--overdue) ${completedAngle + scheduledAngle}deg 360deg)` : "var(--line)" }}>
              <div><strong>{rate}</strong><span>{data.total ? "concluídas" : "Sem atividades"}</span></div>
            </div>
            <div className="completion-legend">
              <div><i className="status-dot status-completed" /><span>Concluídas</span><b>{data.completed}</b></div>
              <div><i className="status-dot status-scheduled" /><span>Sem atraso</span><b>{data.scheduled}</b></div>
              <div><i className="status-dot status-overdue" /><span>Atrasadas</span><b>{data.overdue}</b></div>
            </div>
          </div>
        </section>

        <section className="performance-panel types-performance" aria-labelledby="types-performance-title">
          <div className="performance-panel-heading"><h2 id="types-performance-title">Conclusão por tipo</h2><span>{data.types.length} tipos</span></div>
          <div className="type-performance-list">
            {groups.length ? groups.map(group => <div className="type-performance-row" key={group.id}>
              <div><span title={group.name}><i className="type-dot" style={{ background: group.color }} />{group.name}</span><b>{group.completed}/{group.total}</b></div>
              <progress value={group.completed} max={group.total} style={{ "--progress-color": group.color }} aria-label={`${group.name}, ${group.completed} de ${group.total} concluídas`} />
            </div>) : <p className="performance-empty">As atividades do período aparecerão aqui.</p>}
          </div>
          {pageCount > 1 && <div className="performance-pagination">
            <button type="button" aria-label="Tipos anteriores" disabled={currentPage === 0} onClick={() => setTypePage(currentPage - 1)}>‹</button>
            <span>{currentPage + 1} / {pageCount}</span>
            <button type="button" aria-label="Próximos tipos" disabled={currentPage === pageCount - 1} onClick={() => setTypePage(currentPage + 1)}>›</button>
          </div>}
        </section>

        <section className="performance-panel week-performance" aria-labelledby="week-performance-title">
          <div className="performance-panel-heading"><h2 id="week-performance-title">Prazos nos últimos 7 dias</h2><div className="chart-legend"><span><i className="status-dot status-completed" />Concluídas</span><span><i className="status-dot status-scheduled" />Abertas</span></div></div>
          <div className="weekly-chart">
            {data.days.map(day => <div className="weekly-column" key={day.due} role="img" aria-label={`${day.date.toLocaleDateString("pt-BR")}, ${day.total} atividades com prazo, ${day.completed} concluídas`}>
              <div className="weekly-bar-space" title={`${day.total} atividades · ${day.completed} concluídas`}>
                <span className="weekly-total">{day.total}</span>
                <div className="weekly-bar" style={{ height: `${day.total / chartMax * 100}%` }}>
                  <span style={{ height: `${day.total ? day.completed / day.total * 100 : 0}%` }} />
                </div>
              </div>
              <span className="weekly-day">{day.date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
            </div>)}
          </div>
        </section>

        <section className="performance-panel priority-performance" aria-labelledby="priority-performance-title">
          <div className="performance-panel-heading"><h2 id="priority-performance-title">Por prioridade</h2><span>Concluídas / total</span></div>
          <div className="priority-performance-list">
            {data.priorities.map(priority => <div className="priority-performance-row" key={priority.id}>
              <span className={`priority priority-${priority.id}`}>{priority.name}</span>
              <progress value={priority.completed} max={Math.max(1, priority.total)} aria-label={`Prioridade ${priority.name.toLowerCase()}, ${priority.completed} de ${priority.total} concluídas`} />
              <b>{priority.completed}/{priority.total}</b>
            </div>)}
          </div>
        </section>
      </div>
    </>}
  </section>;
}
