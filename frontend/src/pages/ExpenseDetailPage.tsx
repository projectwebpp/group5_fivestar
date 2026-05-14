import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getExpense, deleteExpense } from '../api/expenses';
import { listCategories } from '../api/categories';
import type { Category } from '../api/categories';
import type { Expense } from '../types/expense';
import Spinner from '../components/Spinner';
import { color, font, radius, shadow } from '../theme';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: color.text3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>
        {label}
      </p>
      <p style={{ fontSize: 15, color: color.text1, margin: 0, fontWeight: 500 }}>{value}</p>
    </div>
  );
}

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
      .then(([e, cats]) => { setExpense(e); setCategories(cats); })
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

  if (loading) return <Spinner fullPage />;

  if (error || !expense) {
    return (
      <div style={{ fontFamily: font, padding: 24, color: color.danger }}>{error ?? 'Not found.'}</div>
    );
  }

  const cat = categories.find(c => c.id === expense.category_id);
  const [year, month, day] = expense.date.split('-').map(Number);
  const dateLabel = new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <div style={{ fontFamily: font, minHeight: '100vh', background: color.bg, paddingBottom: 64 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>

        <button
          onClick={() => navigate('/expenses')}
          style={{
            background: 'none', border: 'none', fontSize: 13, fontWeight: 500,
            color: color.text2, cursor: 'pointer', padding: 0, marginBottom: 24, fontFamily: font,
          }}
        >
          ← Back to Expenses
        </button>

        {/* Amount hero */}
        <div
          style={{
            background: color.accent,
            borderRadius: radius.xl,
            padding: '28px 28px 24px',
            marginBottom: 16,
            boxShadow: shadow.md,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
            Amount
          </p>
          <p style={{ fontSize: 40, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-1px' }}>
            ฿{expense.amount.toFixed(2)}
          </p>
        </div>

        {/* Details card */}
        <div
          style={{
            background: color.surface,
            borderRadius: radius.xl,
            padding: 28,
            boxShadow: shadow.sm,
            border: `1px solid ${color.border}`,
            marginBottom: 16,
          }}
        >
          <DetailRow label="Description" value={expense.description} />
          <DetailRow label="Category" value={cat ? cat.name : `Category #${expense.category_id}`} />
          <DetailRow label="Date" value={dateLabel} />
          {expense.notes && <DetailRow label="Notes" value={expense.notes} />}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            to={`/expenses/${expense.id}/edit`}
            style={{
              flex: 1, textAlign: 'center', padding: '12px 16px',
              background: color.accent, color: '#fff', fontWeight: 600,
              fontSize: 14, borderRadius: radius.md, textDecoration: 'none',
            }}
          >
            Edit
          </Link>
          {!showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                flex: 1, padding: '12px 16px', background: color.dangerLight,
                color: color.danger, fontWeight: 600, fontSize: 14,
                border: `1.5px solid #FECACA`, borderRadius: radius.md,
                cursor: 'pointer', fontFamily: font,
              }}
            >
              Delete
            </button>
          )}
        </div>

        {showDeleteConfirm && (
          <div
            style={{
              marginTop: 16, padding: 20, background: color.dangerLight,
              borderRadius: radius.lg, border: `1px solid #FECACA`,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: color.text1, margin: '0 0 14px' }}>
              Delete this expense? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: '11px 16px', background: color.danger,
                  color: '#fff', fontWeight: 600, fontSize: 14, border: 'none',
                  borderRadius: radius.md, cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.6 : 1, fontFamily: font,
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  flex: 1, padding: '11px 16px', background: color.surface,
                  color: color.text1, fontWeight: 600, fontSize: 14,
                  border: `1.5px solid ${color.border}`, borderRadius: radius.md,
                  cursor: 'pointer', fontFamily: font,
                }}
              >
                Keep it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
