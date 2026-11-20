import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Posiciona listas fora das modais para evitar cortes por overflow.
function useFloatingMenu(open, root, menu, preferredHeight = 260) {
  const [position, setPosition] = useState(null);

  // Mede o botão e a lista antes de o navegador pintar o dropdown.
  // Assim a posição inicial é a mesma usada após uma rolagem.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }

    function update() {
      const rect = root.current?.getBoundingClientRect();
      const menuElement = menu.current;
      if (!rect || !menuElement) return;

      const margin = 10;
      const gap = 5;
      const below = Math.max(0, window.innerHeight - rect.bottom - margin - gap);
      const aboveSpace = Math.max(0, rect.top - margin - gap);
      const desiredHeight = Math.min(menuElement.scrollHeight || preferredHeight, preferredHeight);
      const openAbove = below < desiredHeight && aboveSpace > below;
      const height = Math.min(desiredHeight, openAbove ? aboveSpace : below);
      const width = Math.min(rect.width, window.innerWidth - margin * 2);
      const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));

      setPosition({
        position: 'fixed',
        top: openAbove ? rect.top - height - gap : rect.bottom + gap,
        left,
        width,
        maxHeight: Math.max(0, height),
        zIndex: 200,
      });
    }

    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (root.current) observer?.observe(root.current);
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, true);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [open, root, menu, preferredHeight]);

  return position;
}

export function SelectInput({ value, onChange, options, placeholder = 'Selecione...', required = false }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const menu = useRef(null);
  const id = useId();
  const position = useFloatingMenu(open, root, menu);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!root.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, [open]);

  return (
    <div className="custom-control" ref={root}>
      <button type="button" className={`custom-trigger ${open ? 'is-open' : ''}`} aria-expanded={open} aria-controls={id} aria-haspopup="listbox" onClick={() => setOpen(!open)}>
        <span>{selected?.label || placeholder}</span>
        <ChevronDown size={17} />
      </button>
      {open && createPortal(
        <div ref={menu} id={id} className="custom-menu custom-menu-portal" style={{ ...position, visibility: position ? 'visible' : 'hidden' }} role="listbox" tabIndex={-1} onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && options.length) {
            event.preventDefault();
            const index = options.findIndex((option) => option.value === value);
            const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
            if (options[next]) onChange(options[next].value);
          }
        }}>
          {options.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={value === option.value} className={`custom-option ${value === option.value ? 'selected' : ''}`} onClick={() => { onChange(option.value); setOpen(false); }}>
              <span>{option.label}</span>
              {value === option.value && <Check size={15} />}
            </button>
          ))}
        </div>, document.body
      )}
    </div>
  );
}

export function TimeInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const root = useRef(null);
  const menu = useRef(null);
  const [hour, minute] = (value || '00:00').split(':');

  useEffect(() => {
    if (!open) return undefined;

    function updatePosition() {
      const rect = root.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(250, Math.max(210, window.innerWidth - 24));
      const height = menu.current?.offsetHeight || 290;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const above = spaceBelow < height + 12 && spaceAbove > spaceBelow;

      setPosition({
        top: above
          ? Math.max(12, rect.top - height - 6)
          : Math.min(rect.bottom + 6, window.innerHeight - height - 12),
        left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
        width
      });
    }

    function onPointerDown(event) {
      if (!root.current?.contains(event.target) && !menu.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    updatePosition();
    window.addEventListener('resize', updatePosition);
    document.addEventListener('scroll', updatePosition, true);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="custom-control" ref={root}>
      <button
        type="button"
        className={`custom-trigger ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        aria-label={`Horário ${value}`}
        onClick={() => setOpen((previous) => !previous)}
      >
        <span>{value || '00:00'}</span>
        <Clock3 size={17} />
      </button>
      {open && createPortal(
        <div
          ref={menu}
          className="custom-menu time-menu time-menu-portal"
          style={{
            position: 'fixed',
            top: position?.top ?? -9999,
            left: position?.left ?? -9999,
            width: position?.width ?? 250,
            visibility: position ? 'visible' : 'hidden'
          }}
        >
          <div className="time-heading">Selecionar horário</div>
          <div className="time-columns">
            <div className="time-column" aria-label="Horas">
              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
                <button
                  type="button"
                  key={h}
                  className={hour === h ? 'selected' : ''}
                  onClick={() => onChange(`${h}:${minute}`)}
                >
                  {h}
                </button>
              ))}
            </div>
            <span className="time-separator">:</span>
            <div className="time-column" aria-label="Minutos">
              {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                <button
                  type="button"
                  key={m}
                  className={minute === m ? 'selected' : ''}
                  onClick={() => onChange(`${hour}:${m}`)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="button primary full" onClick={() => setOpen(false)}>
            Confirmar horário
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

function isoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function DateInput({ value, onChange, placeholder = 'Selecionar data' }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value ? new Date(`${value}T12:00:00`) : new Date());
  const root = useRef(null);
  useEffect(() => {
    const close = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const display = value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : placeholder;

  return <div className="custom-control" ref={root}>
    <button type="button" className={`custom-trigger ${open ? 'is-open' : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}><span>{display}</span><CalendarDays size={17} /></button>
    {open && <div className="custom-menu date-menu">
      <div className="date-heading">
        <button type="button" aria-label="Mês anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
        <strong>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
        <button type="button" aria-label="Próximo mês" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={17} /></button>
      </div>
      <div className="date-days">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <span key={index}>{day}</span>)}
        {Array.from({ length: first }, (_, index) => <span key={`empty-${index}`} />)}
        {Array.from({ length: days }, (_, index) => {
          const date = isoDay(new Date(month.getFullYear(), month.getMonth(), index + 1));
          return <button type="button" key={date} className={`${value === date ? 'selected' : ''} ${date === isoDay(new Date()) ? 'current' : ''}`} onClick={() => { onChange(date); setOpen(false); }}>{index + 1}</button>;
        })}
      </div>
      <button type="button" className="button subtle full" onClick={() => { const today = new Date(); onChange(isoDay(today)); setMonth(today); setOpen(false); }}>Hoje</button>
    </div>}
  </div>;
}

export function ImageInput({ value, onChange, existingImage = '', label = 'Imagem' }) {
  const input = useRef(null);
  const pasteArea = useRef(null);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!value) { setPreview(''); return; }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function accept(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Cole ou selecione uma imagem válida.');
    if (file.size > 5 * 1024 * 1024) return toast.error('A imagem deve ter no máximo 5 MB.');
    onChange(file);
  }

  return <div className="image-input" ref={pasteArea} tabIndex={0} role="group" aria-label="Área para colar imagem com Ctrl+V" onClick={(event) => { if (event.target === event.currentTarget || event.target.closest(".image-input-hint")) pasteArea.current?.focus(); }} onPaste={(event) => {
    const item = Array.from(event.clipboardData?.items || []).find((entry) => entry.type.startsWith('image/'));
    if (item) { event.preventDefault(); accept(item.getAsFile()); }
  }}>
    <input ref={input} type="file" accept="image/*" className="visually-hidden" onChange={(event) => accept(event.target.files?.[0])} />
    <button type="button" className="image-pick" onClick={() => input.current?.click()}><ImagePlus size={19} /> Escolher imagem</button>
    {(preview || existingImage) && <div className="image-preview"><img src={preview || existingImage} alt={`Prévia: ${label}`} />{value && <button type="button" className="icon-button" aria-label="Remover imagem selecionada" onClick={() => { onChange(null); if (input.current) input.current.value = ''; }}><Trash2 size={17} /></button>}</div>}
    <small className="muted image-input-hint">Clique na área pontilhada e pressione Ctrl+V para colar uma imagem. PNG, JPG, WebP ou outra imagem compatível, até 5 MB.</small>
  </div>;
}
