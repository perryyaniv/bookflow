import { useState, useEffect, useRef } from 'react';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
}

function isoToDisplay(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : '';
}

function mask(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) out += '/';
    out += digits[i];
  }
  return out;
}

function parseDisplay(s: string): string {
  const parts = s.split('/');
  if (parts.length !== 3) return '';
  const [d, m, y] = parts;
  if (d?.length !== 2 || m?.length !== 2 || y?.length !== 4) return '';
  const date = new Date(`${y}-${m}-${d}`);
  if (isNaN(date.getTime())) return '';
  return `${y}-${m}-${d}`;
}

export default function DateInput({ value, onChange, className }: Props) {
  const [display, setDisplay] = useState(isoToDisplay(value));
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = mask(e.target.value);
    setDisplay(masked);
    onChange(parseDisplay(masked));
  };

  const handlePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    setDisplay(isoToDisplay(iso));
    onChange(iso);
  };

  const openPicker = () => {
    try { hiddenRef.current?.showPicker(); } catch { hiddenRef.current?.click(); }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={display}
        onChange={handleText}
        placeholder="DD/MM/YYYY"
        maxLength={10}
        inputMode="numeric"
        className={className}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={handlePicker}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
