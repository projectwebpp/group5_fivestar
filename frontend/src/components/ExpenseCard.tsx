import { useState } from 'react';
import type { Expense } from '../types/expense';
import { color, font, shadow, radius } from '../theme';

interface ExpenseCardProps {
  expense: Expense;
  onClick: () => void;
  categoryName?: string;
}

export default function ExpenseCard({ expense, onClick, categoryName }: ExpenseCardProps) {
  const [hovered, setHovered] = useState(false);

  const [year, month, day] = expense.date.split('-').map(Number);
  const formattedDate = new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: radius.lg,
        background: color.surface,
        border: `1px solid ${hovered ? color.borderStrong : color.border}`,
        boxShadow: hovered ? shadow.md : shadow.sm,
        padding: '14px 20px',
        marginBottom: 8,
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: '1fr auto auto auto',
        alignItems: 'center',
        gap: 16,
        fontFamily: font,
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Description + Category */}
      <div style={{ overflow: 'hidden' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: color.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {expense.description}
        </div>
        {categoryName && (
          <div style={{ fontSize: 12, color: color.text3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {categoryName}
          </div>
        )}
      </div>

      {/* Amount */}
      <div style={{ fontWeight: 700, fontSize: 15, color: color.text1, whiteSpace: 'nowrap' }}>
        ฿{expense.amount.toFixed(2)}
      </div>

      {/* Date chip */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: color.text2,
          background: color.surfaceAlt,
          padding: '4px 10px',
          borderRadius: radius.full,
          whiteSpace: 'nowrap',
        }}
      >
        {formattedDate}
      </div>

      {/* Arrow */}
      <div style={{ color: color.text3, fontSize: 14 }}>›</div>
    </div>
  );
}
