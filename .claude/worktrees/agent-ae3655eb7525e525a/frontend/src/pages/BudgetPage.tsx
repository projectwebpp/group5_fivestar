import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../api/budgets';
import type { BudgetRow } from '../types/budget';

export default function BudgetPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear  = now.getFullYear();

  const [rows,      setRows]      = useState<BudgetRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const fetchRows = () => {
    setLoading(true);
    setError(null);
    getBudgets(currentMonth, currentYear)
      .then(data => setRows(data))
      .catch(() => setError('Failed to load budgets. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (row: BudgetRow) => {
    const amount = parseFloat(editValue);
    try {
      if ((!editValue || amount <= 0) && row.budget_id !== null) {
        await deleteBudget(row.budget_id);
      } else if (amount > 0 && row.budget_id !== null) {
        await updateBudget(row.budget_id, { amount });
      } else if (amount > 0 && row.budget_id === null) {
        await createBudget({ category_id: row.category_id, month: currentMonth, year: currentYear, amount });
      }
      setEditingId(null);
      fetchRows();
    } catch {
      setError('Failed to save budget. Please try again.');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4EFE6', padding: '24px', paddingBottom: 48 }}>

      {/* Header + nav */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', margin: 0 }}>Budget</h1>
        <nav style={{ display: 'flex', gap: 16 }}>
          <Link to="/expenses"  style={{ fontSize: 15, fontWeight: 700, color: '#7A7064',              textDecoration: 'none' }}>Expenses</Link>
          <Link to="/analytics" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064',              textDecoration: 'none' }}>Analytics</Link>
          <Link to="/budget"    style={{ fontSize: 15, fontWeight: 700, color: 'oklch(48% 0.10 195)', textDecoration: 'none' }}>Budget</Link>
        </nav>
      </header>

      {/* Error */}
      {error && <p style={{ color: '#C0392B', fontSize: 14, marginBottom: 16 }}>{error}</p>}

      {/* Loading */}
      {loading && <p style={{ color: '#7A7064', fontSize: 15 }}>Loading budgets...</p>}

      {/* Empty state */}
      {!loading && rows.length === 0 && !error && (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#7A7064', marginBottom: 16 }}>
            No categories found. Add categories first.
          </p>
          <Link
            to="/categories"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              background: 'oklch(48% 0.10 195)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              borderRadius: 12,
              textDecoration: 'none',
            }}
          >
            Manage Categories
          </Link>
        </div>
      )}

      {/* Budget table */}
      {!loading && rows.length > 0 && (
        <div style={{
          background: '#FFFCF7',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
          border: '1px solid rgba(31,27,22,0.04)',
          overflowX: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(31,27,22,0.08)' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Category</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Limit (฿)</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Spent (฿)</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Remaining (฿)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isOver    = row.limit !== null && row.spent >= row.limit;
                const isEditing = editingId === row.category_id;

                return (
                  <tr
                    key={row.category_id}
                    style={{ backgroundColor: isOver ? '#FDDEDE' : 'transparent' }}
                  >
                    <td style={{ padding: '10px 16px', fontSize: 14, color: '#1F1B16' }}>
                      {row.category_name}
                    </td>
                    <td
                      style={{ padding: '10px 16px', fontSize: 14, color: '#1F1B16', cursor: isEditing ? 'default' : 'pointer' }}
                      onClick={() => {
                        if (!isEditing) {
                          setEditingId(row.category_id);
                          setEditValue(row.limit !== null ? String(row.limit) : '');
                        }
                      }}
                    >
                      {isEditing ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            autoFocus
                            style={{ width: 90, padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14 }}
                          />
                          <button
                            onClick={() => handleSave(row)}
                            style={{ padding: '4px 10px', background: 'oklch(48% 0.10 195)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
                          >
                            Save
                          </button>
                          <span
                            onClick={e => { e.stopPropagation(); setEditingId(null); }}
                            style={{ fontSize: 13, color: '#7A7064', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Cancel
                          </span>
                        </span>
                      ) : (
                        row.limit !== null ? `฿${row.limit.toFixed(2)}` : '—'
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 14, color: '#1F1B16' }}>
                      ฿{row.spent.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 14, color: isOver ? '#C0392B' : '#1F1B16' }}>
                      {row.remaining !== null ? `฿${row.remaining.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
