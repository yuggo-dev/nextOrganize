import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";

export default function Modal({ title, subtitle, className = "", children, onClose, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog ref={ref} className={`modal${className ? ` ${className}` : ""}`} aria-labelledby="modal-title"
      onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      onClick={event => {
        const bounds = ref.current.getBoundingClientRect();
        const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (event.target === ref.current && outside && !busy) onClose();
      }}>
      <div className="modal-heading">
        <div className="modal-titles">
          <h2 id="modal-title">{title}</h2>
          {subtitle && <p className="modal-subtitle">{subtitle}</p>}
        </div>
        <button type="button" className="icon-button" aria-label="Fechar janela" disabled={busy} onClick={onClose}><FiX aria-hidden="true" /></button>
      </div>
      {children}
    </dialog>
  );
}
