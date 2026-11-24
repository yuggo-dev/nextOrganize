import { useState } from "react";
import { FiSave, FiPlus, FiX, FiCalendar, FiRepeat, FiAlertCircle, FiMinusCircle, FiClock, FiBell, FiFlag, FiTag } from "react-icons/fi";
import { shiftDate } from "../model/recurrence.js";
import Modal from "../../../shared/components/Modal.jsx";
import TypeForm from "../../task-types/TypeForm.jsx";
import TypeIcon from "../../task-types/icons.jsx";

const weekdayOptions = [[1, "Seg", "Segunda-feira"], [2, "Ter", "Terça-feira"], [3, "Qua", "Quarta-feira"], [4, "Qui", "Quinta-feira"], [5, "Sex", "Sexta-feira"], [6, "Sáb", "Sábado"], [0, "Dom", "Domingo"]];
const priorities = [["1", "Alta"], ["2", "Média"], ["3", "Baixa"]];

// Janela de nova tarefa e de edição. Primeiro escolhe-se o jeito da atividade
// (pontual, uma vez; ou habitual, que se repete) e o resto do formulário se
// adapta. Pontuais e habituais escolhem o que acontece se o dia passar sem
// concluir: ficar atrasada ou só não feita (tracks_overdue).
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
  const set = (name, value) => setForm(current => ({ ...current, [name]: value }));
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

  const heading = creatingType ? "Novo tipo" : task ? "Editar atividade" : "Nova atividade";
  const subtitle = creatingType ? "Dê nome, cor e ícone para agrupar suas atividades." : task ? "Ajuste os detalhes e salve." : "Uma tarefa pontual ou um hábito para repetir.";

  return <Modal title={heading} subtitle={subtitle} className={creatingType ? "modal-type" : "modal-task"} onClose={onClose} busy={busy}>
    {creatingType ? <TypeForm onBusyChange={setBusy} onCancel={() => typesOnly ? onClose() : setCreatingType(false)} onSave={async data => {
      const type = await onCreateType(data);
      setForm(current => ({ ...current, type_id: String(type.id) }));
      if (typesOnly) onClose();
      else setCreatingType(false);
    }} /> : <form className="task-form task-form-v2" onSubmit={submit}>
      <fieldset disabled={busy}>
        <div className="kind-switch" role="radiogroup" aria-label="Jeito da atividade">
          {[["none", FiCalendar, "Pontual", "Acontece uma vez"], ["daily", FiRepeat, "Habitual", "Se repete na rotina"]].map(([value, Icon, label, help]) => {
            const active = value === "none" ? !recurringForm : recurringForm;
            return <button key={value} type="button" role="radio" aria-checked={active} className="kind-option"
              onClick={() => !active && set("recurrence", value)}>
              <span className="kind-icon"><Icon aria-hidden="true" /></span>
              <span><strong>{label}</strong><small>{help}</small></span>
            </button>;
          })}
        </div>
        {task && task.recurrence !== "none" && <p className="recurrence-help">As alterações se aplicam à repetição inteira. As conclusões já registradas são preservadas; mudanças no período ou nos dias podem deixar ocorrências antigas fora da agenda.</p>}

        <label className="title-field"><span className="sr-only">O que precisa ser feito?</span>
          <input name="title" autoFocus required maxLength={200} placeholder={recurringForm ? "Ex.: Beber 2L de água" : "Ex.: Pagar conta de luz"} value={form.title} onChange={change} />
        </label>

        <section className="form-block">
          <h3><FiTag aria-hidden="true" /> Tipo</h3>
          <div className="type-chips" role="radiogroup" aria-label="Tipo">
            {types.map(type => <button key={type.id} type="button" role="radio" aria-checked={form.type_id === String(type.id)} className="type-chip"
              style={{ "--chip-color": type.color }} onClick={() => set("type_id", String(type.id))}>
              <TypeIcon icon={type.icon} name={type.name} /><span>{type.name}</span>
            </button>)}
            <button type="button" className="type-chip type-chip-new" onClick={() => setCreatingType(true)}><FiPlus aria-hidden="true" /><span>Novo tipo</span></button>
          </div>
        </section>

        <section className="form-block">
          <h3><FiFlag aria-hidden="true" /> Prioridade</h3>
          <div className="segmented priority-segmented" role="radiogroup" aria-label="Prioridade">
            {priorities.map(([value, label]) => <button key={value} type="button" role="radio" aria-checked={form.priority === value} className={`p-${value}`} onClick={() => set("priority", value)}>
              <span className="priority-dot" aria-hidden="true" />{label}
            </button>)}
          </div>
        </section>

        <section className="form-block">
          <h3>{recurringForm ? <><FiRepeat aria-hidden="true" /> Repetição</> : <><FiCalendar aria-hidden="true" /> Quando</>}</h3>
          {recurringForm && <div className="segmented" role="radiogroup" aria-label="Frequência">
            {[["daily", "Todos os dias"], ["weekly", "Dias da semana"]].map(([value, label]) =>
              <button key={value} type="button" role="radio" aria-checked={form.recurrence === value} onClick={() => set("recurrence", value)}>{label}</button>)}
          </div>}
          {form.recurrence === "weekly" && <div className="weekday-options" role="group" aria-label="Repetir nos dias">
            {weekdayOptions.map(([day, label, name]) =>
              <button key={day} type="button" aria-label={name} aria-pressed={form.recurrence_days.includes(day)} onClick={() => setForm(current => ({ ...current, recurrence_days: current.recurrence_days.includes(day) ? current.recurrence_days.filter(value => value !== day) : [...current.recurrence_days, day] }))}>{label}</button>
            )}
          </div>}
          <div className="field-pair">
            <label>{recurringForm ? "Começa em" : "Data"}<input name="due" type="date" required={!task || recurringForm} value={form.due} onChange={change} /></label>
            {recurringForm
              ? <label><span className="label-with-icon"><FiBell aria-hidden="true" /> Lembrete</span><input name="notify_time" type="time" value={form.notify_time} onChange={change} aria-describedby="notify-help" /></label>
              : <div className="time-field">
                <div className="time-field-head">
                  <span id="due-time-label" className="label-with-icon"><FiClock aria-hidden="true" /> Horário</span>
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
          {recurringForm && <p className="field-help" id="notify-help">Opcional. Os lembretes chegam numa próxima versão; por enquanto o horário só fica salvo.</p>}
          {recurringForm && <div className="field-pair">
            <label>Duração
              <select value={endMode} onChange={event => setEndMode(event.target.value)}>
                <option value="never">Sem data final</option>
                <option value="date">Até uma data</option>
                <option value="duration">Por um período</option>
              </select>
            </label>
            {endMode === "date" && <label>Último dia
              <input name="recurrence_until" type="date" required min={form.due} value={form.recurrence_until} onChange={change} />
            </label>}
            {endMode === "duration" && <div className="duration-inline">
              <label>Durante<input type="number" required min="1" max="3650" step="1" value={duration} onChange={event => setDuration(event.target.value)} /></label>
              <label><span className="sr-only">Unidade</span><select aria-label="Unidade" value={durationUnit} onChange={event => setDurationUnit(event.target.value)}><option value="days">dias</option><option value="weeks">semanas</option></select></label>
            </div>}
          </div>}
        </section>

        <section className="form-block">
          <h3>Se o dia passar sem concluir</h3>
          <div className="overdue-options" role="radiogroup" aria-label="Se o dia passar sem concluir">
            {[[true, FiAlertCircle, "Atrasada", recurringForm ? "Fica pendente e conta como atraso" : "Conta como atraso depois do horário ou da data"],
              [false, FiMinusCircle, "Não feita", "Sai das pendências e só registra que não foi feita"]].map(([value, Icon, label, help]) =>
              <button key={label} type="button" role="radio" aria-checked={form.tracks_overdue === value} className={`overdue-option ${value ? "is-late" : "is-missed"}`}
                onClick={() => set("tracks_overdue", value)}>
                <Icon aria-hidden="true" /><span><strong>{label}</strong><small>{help}</small></span>
              </button>)}
          </div>
        </section>

        {error && <div className="err" role="alert">{error}</div>}
        <div className="form-actions">
          <button type="button" onClick={onClose}><FiX aria-hidden="true" /> Cancelar</button>
          <button className="main" type="submit">{task ? <FiSave aria-hidden="true" /> : <FiPlus aria-hidden="true" />}{busy ? "Salvando…" : task ? "Salvar alterações" : recurringForm ? "Adicionar hábito" : "Adicionar tarefa"}</button>
        </div>
      </fieldset>
    </form>}
  </Modal>;
}
