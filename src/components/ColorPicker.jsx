import { useRef } from 'react';

function hsvToHex(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  };
  return `#${[f(5), f(3), f(1)].map((channel) => Math.round(channel * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function hexToHsv(hex) {
  if (!/^#[\da-f]{6}$/i.test(hex)) return { h: 160, s: 0.6, v: 0.8 };
  const [r, g, b] = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? delta / max : 0, v: max };
}

export default function ColorPicker({ value, onChange }) {
  const area = useRef(null);
  const { h, s, v } = hexToHsv(value);

  function selectPoint(event) {
    const rect = area.current?.getBoundingClientRect();
    if (!rect) return;
    const saturation = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const brightness = 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    onChange(hsvToHex(h, saturation, brightness));
  }

  return (
    <div className="advanced-color-picker">
      <div
        ref={area}
        className="color-saturation-area"
        style={{ backgroundColor: hsvToHex(h, 1, 1) }}
        role="slider"
        aria-label="Saturação e luminosidade da cor"
        aria-valuetext={`Saturação ${Math.round(s * 100)}%, luminosidade ${Math.round(v * 100)}%`}
        tabIndex={0}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          selectPoint(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons) selectPoint(event);
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.02;
          if (event.key === 'ArrowRight') onChange(hsvToHex(h, Math.min(1, s + step), v));
          else if (event.key === 'ArrowLeft') onChange(hsvToHex(h, Math.max(0, s - step), v));
          else if (event.key === 'ArrowUp') onChange(hsvToHex(h, s, Math.min(1, v + step)));
          else if (event.key === 'ArrowDown') onChange(hsvToHex(h, s, Math.max(0, v - step)));
          else return;
          event.preventDefault();
        }}
      >
        <span className="color-saturation-white" />
        <span className="color-saturation-black" />
        <span className="color-picker-handle" style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }} />
      </div>
      <label className="color-hue-label" htmlFor="category-hue">Tonalidade</label>
      <input
        id="category-hue"
        className="color-hue-range"
        type="range"
        min="0"
        max="359"
        value={Math.round(h)}
        onChange={(event) => onChange(hsvToHex(Number(event.target.value), s, v))}
        aria-label="Tonalidade da cor"
      />
    </div>
  );
}
