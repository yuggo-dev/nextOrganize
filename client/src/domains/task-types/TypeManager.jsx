import { useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import Modal from '../../shared/components/Modal.jsx';
import TypeForm from './TypeForm.jsx';
import TypeIcon from './icons.jsx';

// Personalizar tipos: escolhe-se o tipo numa fileira de chips e edita-se
// nome, cor e ícone logo abaixo.
export default function TypeManager({ types, onSave, onClose }) {
  const [selected, setSelected] = useState(types[0]?.id);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const type = types.find(item => item.id === selected);
  return <Modal title="Personalizar tipos" subtitle="Nome, cor e ícone valem para todas as atividades do tipo." className="modal-type" onClose={onClose} busy={busy}>
    <div className="type-manager">
      <div className="type-chips" role="radiogroup" aria-label="Tipo para editar">
        {types.map(item => <button key={item.id} type="button" role="radio" disabled={busy} aria-checked={item.id === selected} className="type-chip"
          style={{ '--chip-color': item.color }} onClick={() => { setSelected(item.id); setSaved(false); }}>
          <TypeIcon icon={item.icon} name={item.name} /><span>{item.name}</span>
        </button>)}
      </div>
      {saved && <p className="type-saved" role="status"><FiCheckCircle aria-hidden="true" /> Tipo atualizado.</p>}
      {type ? <TypeForm key={type.id} initialType={type} cancelLabel="Fechar" onBusyChange={setBusy} onCancel={onClose} onSave={async form => { setSaved(false); await onSave(type.id, form); setSaved(true); }} /> : <p>Nenhum tipo cadastrado.</p>}
    </div>
  </Modal>;
}
