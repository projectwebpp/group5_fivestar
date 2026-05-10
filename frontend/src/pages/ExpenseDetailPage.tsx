import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getExpense, deleteExpense } from '../api/expenses';
import { listCategories } from '../api/categories';
import type { Category } from '../api/categories';
import type { Expense } from '../types/expense';

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getExpense(Number(id)), listCategories()])
      .then(([e, cats]) => {
        setExpense(e);
        setCategories(cats);
      })
      .catch(() => setError('Failed to load expense.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function confirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteExpense(Number(id));
      navigate('/expenses');
    } catch {
      setError('Failed to delete. Please try again.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return <div style={{ fontFamily: 'sans-serif', padding: 24 }}>Loading...</div>;
  }
  if (error || !expense) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: 24, color: '#C0392B' }}>
        {error ?? 'Not found.'}
      </div>
    );
  }

  const cat = categories.find(c => c.id === expense.category_id);
  const [year, month, day] = expense.date.split('-').map(Number);
  const dateLabel = new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4EFE6', padding: 24 }}>
      <button
        onClick={() => navigate('/expenses')}
        style={{ background: 'none', border: 'none', fontSize: 14, color: '#7A7064', cursor: 'pointer', marginBottom: 16 }}
      >
        ← Back
      </button>

      <div
        style={{
          background: '#FFFCF7',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
        }}
      >
        <p style={{ fontSize: 13, color: '#7A7064', margin: '0 0 4px 0' }}>Amount</p>
        <p style={{ fontSize: 36, fontWeight: 700, color: '#1F1B16', margin: '0 0 24px 0' }}>
          ฿ {expense.amount.toFixed(2)}
        </p>

        <p style={{ fontSize: 13, color: '#7A7064', margin: '0 0 4px 0' }}>Category</p>
        <p style={{ fontSize: 15, color: '#1F1B16', margin: '0 0 16px 0' }}>
          {cat ? cat.name : `Category #${expense.category_id}`}
        </p>

        <p style={{ fontSize: 13, color: '#7A7064', margin: '0 0 4px 0' }}>Description</p>
        <p style={{ fontSize: 15, color: '#1F1B16', margin: '0 0 16px 0' }}>{expense.description}</p>

        <p style={{ fontSize: 13, color: '#7A7064', margin: '0 0 4px 0' }}>Date</p>
        <p style={{ fontSize: 15, color: '#1F1B16', margin: '0 0 24px 0' }}>{dateLabel}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Link
          to={`/expenses/${expense.id}/edit`}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '12px 16px',
            background: 'oklch(48% 0.10 195)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            borderRadius: 12,
            textDecoration: 'none',
          }}
        >
          Edit
        </Link>
        {!showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#EDE7DA',
              color: '#C0392B',
              fontWeight: 700,
              fontSize: 14,
              border: '1px solid #C0392B',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Delete Expense
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: '#FFFCF7',
            borderRadius: 12,
            border: '1px solid rgba(31,27,22,0.04)',
          }}
        >
          <p style={{ fontSize: 15, color: '#1F1B16', margin: '0 0 12px 0' }}>Are you sure?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#C0392B',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                borderRadius: 12,
                cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#EDE7DA',
                color: '#1F1B16',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Keep Expense
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
