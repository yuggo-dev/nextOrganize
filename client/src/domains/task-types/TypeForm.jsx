import { useState } from "react";

const colors = ["#6366f1", "#3b82f6", "#14b8a6", "#22c55e", "#f59e0b", "#f97316", "#ec4899", "#a855f7"];

export default function TypeForm({ onSave, onCancel, onBusyChange }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try { await onSave({ name, color }); }
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
      <div className="type-preview"><i className="type-dot" style={{ background: color }} />{name.trim() || "Novo tipo"}</div>
      {error && <div className="err" role="alert">{error}</div>}
      <div className="form-actions">
        <button type="button" onClick={onCancel}>Voltar</button>
        <button className="main" type="submit">{busy ? "Salvando…" : "Criar tipo"}</button>
      </div>
    </fieldset>
  </form>;
}
