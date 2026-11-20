import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function Field({ label, children, asLabel = true }) {
  const Tag = asLabel ? "label" : "div";
  return <Tag className="field"><span>{label}</span>{children}</Tag>;
}

export function Empty({ text = 'Nenhum resultado encontrado.' }) {
  return <div className="empty-state">{text}</div>;
}

export function Confirm({ message, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Confirmar ação" onClose={onClose}>
      <p>{message}</p>
      <div className="form-actions">
        <button className="button secondary" onClick={onClose}>Cancelar</button>
        <button className="button danger" disabled={busy} onClick={async () => {
          setBusy(true);
          try { await onConfirm(); onClose(); } finally { setBusy(false); }
        }}>Confirmar</button>
      </div>
    </Modal>
  );
}
