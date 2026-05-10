import type { Expense } from '../types/expense';

interface ExpenseCardProps {
  expense: Expense;
  onClick: () => void;
}

export default function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  const formattedDate = new Date(expense.date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      style={{
        borderRadius: 16,
        background: '#FFFCF7',
        border: '1px solid rgba(31,27,22,0.04)',
        boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
        padding: '16px',
        marginBottom: 8,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 15, color: '#1F1B16' }}>
        ฿ {expense.amount.toFixed(2)}
      </span>
      <span style={{ fontWeight: 400, fontSize: 15, color: '#7A7064' }}>
        Category #{expense.category_id}
      </span>
      <span style={{ fontSize: 13, color: '#7A7064' }}>
        {formattedDate}
      </span>
    </div>
  );
}
