import { useState } from 'react';
import Modal from '../../shared/components/Modal.jsx';
import TypeForm from './TypeForm.jsx';
import TypeIcon from './icons.jsx';

export default function TypeManager({types,onSave,onClose}) {
  const [selected,setSelected]=useState(types[0]?.id);
  const [busy,setBusy]=useState(false);
  const [saved,setSaved]=useState(false);
  const type=types.find(item=>item.id===selected);
  return <Modal title="Personalizar tipos" onClose={onClose} busy={busy}>
    <div className="type-manager">
      {type && <div className="type-manager-identity" style={{"--theme-color":type.color}}><span><TypeIcon icon={type.icon} name={type.name} /></span><div><strong>{type.name}</strong><small>Seu tema, do seu jeito</small></div></div>}
      <label>Tipo para editar
        <select disabled={busy} value={selected || ''} onChange={event=>{setSelected(Number(event.target.value));setSaved(false);}}>
          {types.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <p className="recurrence-help">O nome, a cor e o ícone serão aplicados a todas as tarefas deste tipo.</p>
      {saved && <p role="status">Tipo atualizado.</p>}
      {type ? <TypeForm key={type.id} initialType={type} onBusyChange={setBusy} onCancel={onClose} onSave={async form=>{setSaved(false);await onSave(type.id,form);setSaved(true);}} /> : <p>Nenhum tipo cadastrado.</p>}
    </div>
  </Modal>;
}
