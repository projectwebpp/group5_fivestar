import { Link } from 'react-router-dom';

interface EmptyStateProps {
  filtered: boolean;
}

export default function EmptyState({ filtered }: EmptyStateProps) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', marginBottom: 12 }}>
        {filtered ? 'No matching expenses' : 'No expenses yet'}
      </h2>
      <p style={{ fontSize: 15, fontWeight: 400, color: '#7A7064', marginBottom: 24 }}>
        {filtered
          ? 'No expenses match your filters. Try adjusting the date range or category.'
          : 'Start tracking your spending — add your first expense.'}
      </p>
      <Link
        to="/expenses/new"
        style={{
          padding: '8px 16px',
          background: 'oklch(48% 0.10 195)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          borderRadius: 12,
          textDecoration: 'none',
        }}
      >
        Add Expense
      </Link>
    </div>
  );
}
