import { useState } from "react";
import { FiSave, FiPlus, FiArrowLeft, FiDroplet } from "react-icons/fi";
import IconPicker from "./IconPicker.jsx";
import TypeIcon from "./icons.jsx";

const colors = ["#6366f1", "#3b82f6", "#14b8a6", "#22c55e", "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#a855f7", "#64748b"];

// Formulário de tipo: prévia ao vivo no topo (como o tipo aparece num card da
// agenda), nome, cor (sugestões ou personalizada) e ícone.
export default function TypeForm({ onSave, onCancel, onBusyChange, initialType, cancelLabel = "Voltar" }) {
  const [name, setName] = useState(initialType?.name || "");
  const [color, setColor] = useState(initialType?.color || colors[0]);
  const [icon, setIcon] = useState(initialType?.icon ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const custom = !colors.includes(color.toLowerCase());

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try { await onSave({ name, color, icon }); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); onBusyChange?.(false); }
  };

  return <form className="type-form type-form-v2" onSubmit={submit} style={{ "--type-color": color }}>
    <fieldset disabled={busy}>
      <div className="type-live-preview" aria-label="Prévia do tipo">
        <span className="type-live-icon"><TypeIcon icon={icon} name={name} /></span>
        <div className="type-live-text">
          <strong>{name.trim() || "Novo tipo"}</strong>
          <small>Assim ele aparece na agenda e no calendário</small>
        </div>
        <span className="type-live-chip"><TypeIcon icon={icon} name={name} />{name.trim() || "Tipo"}</span>
      </div>
      <label>Nome do tipo
        <input autoFocus required maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Alimentação" />
      </label>
      <div className="color-field">
        <span>Cor</span>
        <div className="color-options" role="radiogroup" aria-label="Cor do tipo">
          {colors.map(value => <button key={value} type="button" role="radio" className="color-option" style={{ background: value }}
            aria-label={`Cor ${value}`} aria-checked={color.toLowerCase() === value} aria-pressed={color.toLowerCase() === value} onClick={() => setColor(value)} />)}
          <label className={`color-custom${custom ? " is-active" : ""}`} title="Escolher outra cor" style={custom ? { background: color } : undefined}>
            <FiDroplet aria-hidden="true" />
            <input type="color" aria-label="Cor personalizada" value={color} onChange={event => setColor(event.target.value)} />
          </label>
        </div>
      </div>
      <IconPicker value={icon} onChange={setIcon} name={name} color={color} />
      {error && <div className="err" role="alert">{error}</div>}
      <div className="form-actions">
        <button type="button" onClick={onCancel}><FiArrowLeft aria-hidden="true" /> {cancelLabel}</button>
        <button className="main" type="submit">{initialType ? <FiSave aria-hidden="true" /> : <FiPlus aria-hidden="true" />}{busy ? "Salvando…" : initialType ? "Salvar alterações" : "Criar tipo"}</button>
      </div>
    </fieldset>
  </form>;
}
