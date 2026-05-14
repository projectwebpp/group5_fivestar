import { useState } from 'react';
import { color, font, radius } from '../theme';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

function NavBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 18px',
        background: disabled ? color.surfaceAlt : hovered ? color.accentLight : color.surface,
        color: disabled ? color.text3 : color.accent,
        fontWeight: 600,
        fontSize: 13,
        fontFamily: font,
        border: `1.5px solid ${disabled ? color.border : color.accent}`,
        borderRadius: radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

export default function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, fontFamily: font }}>
      <NavBtn label="← Prev" disabled={page <= 1} onClick={onPrev} />
      <span style={{ fontSize: 13, color: color.text2, fontWeight: 500 }}>
        Page {page} of {totalPages}
      </span>
      <NavBtn label="Next →" disabled={page >= totalPages} onClick={onNext} />
    </div>
  );
}
