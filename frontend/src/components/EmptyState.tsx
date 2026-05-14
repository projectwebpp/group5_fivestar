import { Link } from 'react-router-dom';
import { color, font, radius, shadow } from '../theme';

export default function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div
      style={{
        padding: '56px 24px',
        textAlign: 'center',
        background: color.surface,
        borderRadius: radius.xl,
        border: `1px solid ${color.border}`,
        boxShadow: shadow.sm,
        fontFamily: font,
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 16 }}>{filtered ? '🔍' : '🧾'}</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: color.text1, margin: '0 0 8px' }}>
        {filtered ? 'No matching expenses' : 'No expenses yet'}
      </h2>
      <p style={{ fontSize: 14, color: color.text2, margin: '0 0 24px', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        {filtered
          ? 'No expenses match your filters. Try adjusting the date range or category.'
          : 'Start tracking your spending — add your first expense.'}
      </p>
      {!filtered && (
        <Link
          to="/expenses/new"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: color.accent,
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            borderRadius: radius.md,
            textDecoration: 'none',
          }}
        >
          + Add Expense
        </Link>
      )}
    </div>
  );
}
