import { useState } from "react";
import { FiSave, FiPlus, FiX } from "react-icons/fi";
import { shiftDate } from "../model/recurrence.js";
import Modal from "../../../shared/components/Modal.jsx";
import TypeForm from "../../task-types/TypeForm.jsx";

export default function TaskDialog({ selected, types, onSave, onCreateType, onClose, typesOnly = false, task }) {
  const [creatingType, setCreatingType] = useState(typesOnly);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [endMode, setEndMode] = useState(task?.recurrence_until ? "date" : "never");
  const [duration, setDuration] = useState("4");
  const [durationUnit, setDurationUnit] = useState("weeks");
  const [form, setForm] = useState({ title: task?.title || "", type_id: String(task?.type_id || types[0]?.id || ""), priority: String(task?.priority || 2), due: task ? task.due || "" : selected,
    due_time: task?.due_time || "", notify_time: task?.notify_time || "", tracks_overdue: task?.tracks_overdue !== false,
    recurrence: task?.recurrence || "none", recurrence_days: task?.recurrence_days?.length ? task.recurrence_days : [1, 3, 5], recurrence_until: task?.recurrence_until || "" });
  // Pontuais: com horário de conclusão (padrão ao criar) ou só com a data.
  const [timed, setTimed] = useState(task ? !!task.due_time : true);
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const recurringForm = form.recurrence !== "none";

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (form.recurrence === "weekly" && !form.recurrence_days.length) throw new Error("Selecione pelo menos um dia da semana.");
      const recurring = form.recurrence !== "none";
      const amount = Number(duration);
      if (recurring && endMode === "duration" && (!Number.isInteger(amount) || amount < 1 || amount > 3650)) throw new Error("Informe um período entre 1 e 3650.");
      const until = !recurring || endMode === "never" ? null : endMode === "date" ? form.recurrence_until : shiftDate(form.due, amount * (durationUnit === "weeks" ? 7 : 1) - 1);
      await onSave({ ...form, priority: Number(form.priority), type_id: Number(form.type_id),
        due_time: !recurring && timed ? form.due_time : null,
        notify_time: recurring ? form.notify_time || null : null,
        recurrence_days: form.recurrence === "weekly" ? form.recurrence_days : [], recurrence_until: until });
      onClose();
    } catch (error) { setError(error.message); setBusy(false); }
  };

  return <Modal title={creatingType ? "Novo tipo de tarefa" : task ? "Editar tarefa" : "Nova tarefa"} onClose={onClose} busy={busy}>
    {creatingType ? <TypeForm onBusyChange={setBusy} onCancel={() => typesOnly ? onClose() : setCreatingType(false)} onSave={async data => {
      const type = await onCreateType(data);
      setForm(current => ({ ...current, type_id: String(type.id) }));
      if (typesOnly) onClose();
      else setCreatingType(false);
    }} /> : <form className="task-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        {task && task.recurrence !== "none" && <p className="recurrence-help">As alterações se aplicam à repetição inteira. As conclusões já registradas são preservadas; mudanças no período ou nos dias podem deixar ocorrências antigas fora da agenda.</p>}
        <label>O que precisa ser feito?
          <input name="title" autoFocus required maxLength={200} placeholder="Escreva sua tarefa" value={form.title} onChange={change} />
        </label>
        <div className="field-pair">
          <label>Tipo
            <select name="type_id" required value={form.type_id} onChange={change}>
              <option value="" disabled>Selecione</option>
              {types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label>Prioridade
            <select name="priority" value={form.priority} onChange={change}>
              <option value="1">Alta</option><option value="2">Média</option><option value="3">Baixa</option>
            </select>
          </label>
        </div>
        <button className="text-button" type="button" onClick={() => setCreatingType(true)}><FiPlus aria-hidden="true" /> Criar tipo de tarefa</button>
        <div className="field-pair">
          <label>{recurringForm ? "Data inicial" : "Data de conclusão"}<input name="due" type="date" required={!task || recurringForm} value={form.due} onChange={change} /></label>
          {recurringForm
            ? <label>Horário de notificação<input name="notify_time" type="time" value={form.notify_time} onChange={change} aria-describedby="notify-help" /></label>
            : <div className="time-field">
              <div className="time-field-head">
                <span id="due-time-label">Horário</span>
                <div className="time-mode" role="group" aria-label="Horário de conclusão">
                  <button type="button" aria-pressed={timed} onClick={() => setTimed(true)}>Com</button>
                  <button type="button" aria-pressed={!timed} onClick={() => setTimed(false)}>Sem</button>
                </div>
              </div>
              {timed
                ? <input name="due_time" type="time" required aria-label="Horário de conclusão" value={form.due_time} onChange={change} />
                : <span className="time-none">Só a data</span>}
            </div>}
        </div>
        {recurringForm && <p className="field-help" id="notify-help">Opcional. Os lembretes nesse horário chegam numa próxima versão; por enquanto ele só fica salvo.</p>}
        {!recurringForm && !timed && <p className="field-help">Sem horário, a tarefa só fica atrasada quando a data passar.</p>}
        <div className="field-pair">
          <label>Repetição
            <select name="recurrence" value={form.recurrence} onChange={change}>
              <option value="none">Uma vez</option>
              <option value="daily">Todos os dias</option>
              <option value="weekly">Dias da semana</option>
            </select>
          </label>
          {form.recurrence !== "none" && <label>Duração
            <select value={endMode} onChange={event => setEndMode(event.target.value)}>
              <option value="never">Sem data final</option>
              <option value="date">Até uma data</option>
              <option value="duration">Por um período</option>
            </select>
          </label>}
        </div>
        {form.recurrence === "weekly" && <div className="weekday-field">
          <span id="weekday-label">Repetir nos dias</span>
          <div className="weekday-options" role="group" aria-labelledby="weekday-label">
            {[[1,"Seg","Segunda-feira"],[2,"Ter","Terça-feira"],[3,"Qua","Quarta-feira"],[4,"Qui","Quinta-feira"],[5,"Sex","Sexta-feira"],[6,"Sáb","Sábado"],[0,"Dom","Domingo"]].map(([day,label,name]) =>
              <button key={day} type="button" aria-label={name} aria-pressed={form.recurrence_days.includes(day)} onClick={() => setForm(current => ({...current, recurrence_days: current.recurrence_days.includes(day) ? current.recurrence_days.filter(value => value !== day) : [...current.recurrence_days,day]}))}>{label}</button>
            )}
          </div>
        </div>}
        {form.recurrence !== "none" && endMode === "date" && <label>Último dia da repetição
          <input name="recurrence_until" type="date" required min={form.due} value={form.recurrence_until} onChange={change} />
        </label>}
        {form.recurrence !== "none" && endMode === "duration" && <div className="field-pair">
          <label>Repetir durante<input type="number" required min="1" max="3650" step="1" value={duration} onChange={event => setDuration(event.target.value)} /></label>
          <label>Unidade<select value={durationUnit} onChange={event => setDurationUnit(event.target.value)}><option value="days">Dias</option><option value="weeks">Semanas</option></select></label>
        </div>}
        {recurringForm && <label>Se o dia passar sem concluir
          <select value={form.tracks_overdue ? "overdue" : "missed"} onChange={event => setForm(current => ({ ...current, tracks_overdue: event.target.value === "overdue" }))}>
            <option value="overdue">Marcar como atrasada</option>
            <option value="missed">Só marcar como não feita</option>
          </select>
        </label>}
        {form.recurrence !== "none" && <p className="recurrence-help">Cada ocorrência tem sua própria conclusão. O período conta a partir da data inicial, incluindo o último dia. O combo considera apenas os dias programados.</p>}
        {error && <div className="err" role="alert">{error}</div>}
        <div className="form-actions">
          <button type="button" onClick={onClose}><FiX aria-hidden="true" /> Cancelar</button>
          <button className="main" type="submit">{task ? <FiSave aria-hidden="true" /> : <FiPlus aria-hidden="true" />}{busy ? "Salvando…" : task ? "Salvar alterações" : "Adicionar tarefa"}</button>
        </div>
      </fieldset>
    </form>}
  </Modal>;
}
