import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import { color, font } from '../theme';
import { listRecurring, createRecurring, updateRecurring, deleteRecurring } from '../api/recurring';
import { listCategories } from '../api/categories';
import type { Category } from '../api/categories';
import InlineError from '../components/InlineError';
import type { RecurringExpense, CreateRecurringPayload, UpdateRecurringPayload } from '../types/recurring';

export default function RecurringPage() {
  const [templates,  setTemplates]  = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [formError,  setFormError]  = useState<string | null>(null);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [editData,   setEditData]   = useState<UpdateRecurringPayload>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Create form fields
  const [newDesc,     setNewDesc]     = useState('');
  const [newCatId,    setNewCatId]    = useState<number | ''>('');
  const [newAmount,   setNewAmount]   = useState('');
  const [newFreq,     setNewFreq]     = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [newStart,    setNewStart]    = useState('');
  const [newCurrency, setNewCurrency] = useState('THB');

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([listRecurring(), listCategories()])
      .then(([tmpl, cats]) => {
        setTemplates(tmpl);
        setCategories(cats);
      })
      .catch(() => setError('Failed to load recurring expenses. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setNewDesc('');
    setNewCatId('');
    setNewAmount('');
    setNewFreq('monthly');
    setNewStart('');
    setNewCurrency('THB');
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload: CreateRecurringPayload = {
      description: newDesc,
      category_id: Number(newCatId),
      amount: parseFloat(newAmount),
      currency: newCurrency || 'THB',
      frequency: newFreq,
      start_date: newStart,
    };
    try {
      const created = await createRecurring(payload);
      setTemplates(prev => [created, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg ?? 'Failed to create recurring expense. Please try again.');
    }
  };

  const handleUpdate = async (id: number) => {
    setError(null);
    try {
      const updated = await updateRecurring(id, editData);
      setTemplates(prev => prev.map(t => t.id === id ? updated : t));
      setEditingId(null);
      setEditData({});
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to update recurring expense. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await deleteRecurring(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      setDeletingId(null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to delete recurring expense. Please try again.');
    }
  };

  return (
    <div style={{ fontFamily: font, minHeight: '100vh', background: color.bg, paddingBottom: 64 }}>

      <Header title="Recurring Expenses" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>

      {/* Page-level error */}
      <InlineError message={error} />

      {/* Loading */}
      {loading && <Spinner />}

      {/* Collapsible create form */}
      {!loading && (
        <>
          <button
            onClick={() => { setShowForm(s => !s); if (showForm) resetForm(); }}
            style={{
              marginBottom: 16,
              padding: '8px 18px',
              background: 'oklch(48% 0.10 195)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + Add Recurring Expense
          </button>

          {showForm && (
            <div style={{
              background: '#FFFCF7',
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
              border: '1px solid rgba(31,27,22,0.08)',
            }}>
              <InlineError message={formError} />
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#7A7064', display: 'block', marginBottom: 4 }}>Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    required
                    placeholder="e.g. Netflix subscription"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#7A7064', display: 'block', marginBottom: 4 }}>Category</label>
                  <select
                    value={newCatId}
                    onChange={e => setNewCatId(Number(e.target.value))}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14, boxSizing: 'border-box' }}
                  >
                    <option value="">Select category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#7A7064', display: 'block', marginBottom: 4 }}>Amount</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={newAmount}
                      onChange={e => setNewAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ width: 80 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#7A7064', display: 'block', marginBottom: 4 }}>Currency</label>
                    <input
                      type="text"
                      value={newCurrency}
                      onChange={e => setNewCurrency(e.target.value)}
                      maxLength={3}
                      placeholder="THB"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#7A7064', display: 'block', marginBottom: 4 }}>Frequency</label>
                  <select
                    value={newFreq}
                    onChange={e => setNewFreq(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14, boxSizing: 'border-box' }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#7A7064', display: 'block', marginBottom: 4 }}>Start Date</label>
                  <input
                    type="date"
                    value={newStart}
                    onChange={e => setNewStart(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="submit"
                    style={{ padding: '8px 20px', background: 'oklch(48% 0.10 195)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    style={{ padding: '8px 16px', background: 'transparent', color: '#7A7064', border: '1px solid rgba(31,27,22,0.2)', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && templates.length === 0 && !error && (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#7A7064' }}>
            No recurring expenses yet — click + Add Recurring Expense to get started.
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && templates.length > 0 && (
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
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Description</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Category</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Amount (฿)</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Frequency</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Next Due</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 700, color: '#7A7064' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(template => {
                const isEditing  = editingId  === template.id;
                const isDeleting = deletingId === template.id;

                return (
                  <tr key={template.id} style={{ borderBottom: '1px solid rgba(31,27,22,0.06)' }}>

                    {/* Description */}
                    <td style={{ padding: '10px 16px', fontSize: 14, color: '#1F1B16' }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.description ?? template.description}
                          onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                          style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14 }}
                        />
                      ) : (
                        template.description
                      )}
                    </td>

                    {/* Category */}
                    <td style={{ padding: '10px 16px', fontSize: 14, color: '#1F1B16' }}>
                      {isEditing ? (
                        <select
                          value={editData.category_id ?? template.category_id}
                          onChange={e => setEditData(d => ({ ...d, category_id: Number(e.target.value) }))}
                          style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14 }}
                        >
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        template.category_name ?? '—'
                      )}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '10px 16px', fontSize: 14, color: '#1F1B16' }}>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editData.amount ?? template.amount}
                          onChange={e => setEditData(d => ({ ...d, amount: parseFloat(e.target.value) }))}
                          style={{ width: 90, padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14 }}
                        />
                      ) : (
                        `฿${template.amount.toFixed(2)}`
                      )}
                    </td>

                    {/* Frequency */}
                    <td style={{ padding: '10px 16px', fontSize: 14, color: '#1F1B16' }}>
                      {isEditing ? (
                        <select
                          value={editData.frequency ?? template.frequency}
                          onChange={e => setEditData(d => ({ ...d, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                          style={{ padding: '4px 6px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.2)', fontSize: 14 }}
                        >
                          <option value="daily">daily</option>
                          <option value="weekly">weekly</option>
                          <option value="monthly">monthly</option>
                        </select>
                      ) : (
                        template.frequency
                      )}
                    </td>

                    {/* Next Due — always read-only */}
                    <td style={{ padding: '10px 16px', fontSize: 14, color: '#1F1B16' }}>
                      {template.next_due}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 16px', fontSize: 14, color: '#1F1B16', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleUpdate(template.id)}
                            style={{ padding: '4px 10px', background: 'oklch(48% 0.10 195)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
                          >
                            Save
                          </button>
                          <span
                            onClick={() => { setEditingId(null); setEditData({}); }}
                            style={{ fontSize: 13, color: '#7A7064', cursor: 'pointer', textDecoration: 'underline', marginLeft: 8 }}
                          >
                            Cancel
                          </span>
                        </span>
                      ) : isDeleting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, color: '#7A7064' }}>Delete?</span>
                          <button
                            onClick={() => handleDelete(template.id)}
                            style={{ padding: '4px 10px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
                          >
                            Yes
                          </button>
                          <span
                            onClick={() => setDeletingId(null)}
                            style={{ fontSize: 13, color: '#7A7064', cursor: 'pointer', textDecoration: 'underline', marginLeft: 8 }}
                          >
                            Cancel
                          </span>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => { setEditingId(template.id); setEditData({}); }}
                            style={{ padding: '4px 10px', background: 'oklch(48% 0.10 195)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingId(template.id)}
                            style={{ padding: '4px 10px', background: 'transparent', color: '#C0392B', border: '1px solid #C0392B', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
                          >
                            Delete
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
