import { useEffect, useRef } from "react";

export default function Modal({ title, children, onClose, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={ref} className="modal" aria-labelledby="modal-title"
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={event => {
        const bounds = ref.current.getBoundingClientRect();
        const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (event.target === ref.current && outside && !busy) onClose();
      }}>
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button type="button" className="icon-button" aria-label="Fechar janela" disabled={busy} onClick={onClose}>×</button>
      </div>
      {children}
    </dialog>
  );
}
