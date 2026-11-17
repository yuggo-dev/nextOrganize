import { useState } from "react";
import Modal from "../../../shared/components/Modal.jsx";
import TypeForm from "../../task-types/TypeForm.jsx";

export default function TaskDialog({ selected, types, onSave, onCreateType, onClose, typesOnly = false }) {
  const [creatingType, setCreatingType] = useState(typesOnly);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", type_id: String(types[0]?.id || ""), priority: "2", due: selected, due_time: "", recurrence: "none", recurrence_until: "" });
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({ ...form, priority: Number(form.priority), type_id: Number(form.type_id),
        recurrence_until: form.recurrence === "daily" ? form.recurrence_until || null : null });
      onClose();
    } catch (error) { setError(error.message); setBusy(false); }
  };

  return <Modal title={creatingType ? "Novo tipo de tarefa" : "Nova tarefa"} onClose={onClose} busy={busy}>
    {creatingType ? <TypeForm onBusyChange={setBusy} onCancel={() => typesOnly ? onClose() : setCreatingType(false)} onSave={async data => {
      const type = await onCreateType(data);
      setForm(current => ({ ...current, type_id: String(type.id) }));
      if (typesOnly) onClose();
      else setCreatingType(false);
    }} /> : <form className="task-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <label>O que precisa ser feito?
          <input name="title" autoFocus required maxLength={120} placeholder="Escreva sua tarefa" value={form.title} onChange={change} />
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
        <button className="text-button" type="button" onClick={() => setCreatingType(true)}>+ Criar tipo de tarefa</button>
        <div className="field-pair">
          <label>{form.recurrence === "daily" ? "Data inicial" : "Data de conclusão"}<input name="due" type="date" required value={form.due} onChange={change} /></label>
          <label>Horário de conclusão<input name="due_time" type="time" required value={form.due_time} onChange={change} /></label>
        </div>
        <div className="field-pair">
          <label>Repetição
            <select name="recurrence" value={form.recurrence} onChange={change}>
              <option value="none">Uma vez</option>
              <option value="daily">Todos os dias</option>
            </select>
          </label>
          {form.recurrence === "daily" && <label>Repetir até (opcional)
            <input name="recurrence_until" type="date" min={form.due} value={form.recurrence_until} onChange={change} />
          </label>}
        </div>
        {form.recurrence === "daily" && <p className="recurrence-help">Cada dia tem sua própria conclusão. Dias consecutivos cumpridos formam seu combo.</p>}
        {error && <div className="err" role="alert">{error}</div>}
        <div className="form-actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button className="main" type="submit">{busy ? "Salvando…" : "Adicionar tarefa"}</button>
        </div>
      </fieldset>
    </form>}
  </Modal>;
}
