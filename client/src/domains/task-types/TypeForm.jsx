import { useState } from "react";
import { FiSave, FiPlus, FiArrowLeft } from "react-icons/fi";
import IconPicker from "./IconPicker.jsx";
import TypeIcon from "./icons.jsx";

const colors = ["#6366f1", "#3b82f6", "#14b8a6", "#22c55e", "#f59e0b", "#f97316", "#ec4899", "#a855f7"];

export default function TypeForm({ onSave, onCancel, onBusyChange, initialType }) {
  const [name, setName] = useState(initialType?.name || "");
  const [color, setColor] = useState(initialType?.color || colors[0]);
  const [icon, setIcon] = useState(initialType?.icon ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try { await onSave({ name, color, icon }); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); onBusyChange?.(false); }
  };

  return <form className="type-form" onSubmit={submit}>
    <fieldset disabled={busy}>
      <label>Nome do tipo
        <input autoFocus required maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Alimentação" />
      </label>
      <label>Cor
        <input type="color" value={color} onChange={event => setColor(event.target.value)} />
      </label>
      <div className="color-options" aria-label="Cores sugeridas">
        {colors.map(value => <button key={value} type="button" className="color-option" style={{ background: value }}
          aria-label={`Cor ${value}`} aria-pressed={color === value} onClick={() => setColor(value)} />)}
      </div>
      <IconPicker value={icon} onChange={setIcon} name={name} color={color} />
      <div className="type-preview"><TypeIcon icon={icon} name={name} style={{color}} />{name.trim() || "Novo tipo"}</div>
      {error && <div className="err" role="alert">{error}</div>}
      <div className="form-actions">
        <button type="button" onClick={onCancel}><FiArrowLeft aria-hidden="true" /> Voltar</button>
        <button className="main" type="submit">{initialType ? <FiSave aria-hidden="true" /> : <FiPlus aria-hidden="true" />}{busy ? "Salvando…" : initialType ? "Salvar alterações" : "Criar tipo"}</button>
      </div>
    </fieldset>
  </form>;
}
