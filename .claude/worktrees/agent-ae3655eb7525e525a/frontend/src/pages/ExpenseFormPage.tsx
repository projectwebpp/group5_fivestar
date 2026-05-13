import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createExpense, updateExpense, getExpense } from '../api/expenses';
import { listCategories } from '../api/categories';
import type { Category } from '../api/categories';
import InlineError from '../components/InlineError';
import LoadingButton from '../components/LoadingButton';

export default function ExpenseFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(mode === 'edit');

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setError('Failed to load categories. Please refresh.'))
      .finally(() => setCategoriesLoading(false));
  }, []);

  useEffect(() => {
    if (mode === 'edit' && id) {
      setLoadingExpense(true);
      getExpense(Number(id))
        .then(e => {
          setAmount(e.amount.toFixed(2));
          setCategoryId(e.category_id);
          setDescription(e.description);
          setDate(e.date);
          setNotes(e.notes ?? '');
        })
        .catch(() => setError('Failed to load expense.'))
        .finally(() => setLoadingExpense(false));
    }
  }, [mode, id]);

  function validate(): string | null {
    const num = Number(amount);
    if (!amount || isNaN(num) || num <= 0) return 'Amount must be greater than 0.';
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) return 'Amount can have at most 2 decimal places.';
    if (categoryId === '' || categoryId == null) return 'Please select a category.';
    if (!description.trim()) return 'Please enter a description.';
    if (!date) return 'Please enter a date.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'edit' && !id) {
      setError('Invalid expense ID.');
      return;
    }
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        amount: Number(amount),
        category_id: Number(categoryId),
        description: description.trim(),
        date,
        notes: notes.trim() || undefined,
      };
      if (mode === 'create') {
        await createExpense(payload as Parameters<typeof createExpense>[0]);
      } else {
        await updateExpense(Number(id), payload);
      }
      navigate('/expenses');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: Array<{ message: string }>; message?: string } } };
      const apiMsg =
        e?.response?.data?.errors?.[0]?.message ??
        e?.response?.data?.message ??
        'Something went wrong. Please try again.';
      setError(apiMsg);
    } finally {
      setSaving(false);
    }
  }

  if (loadingExpense) {
    return <div style={{ fontFamily: 'sans-serif', padding: 24 }}>Loading expense...</div>;
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4EFE6', padding: 24 }}>
      <button
        onClick={() => navigate('/expenses')}
        style={{ background: 'none', border: 'none', fontSize: 14, color: '#7A7064', cursor: 'pointer', marginBottom: 16 }}
      >
        ← Back
      </button>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', margin: '0 0 24px 0' }}>
        {mode === 'create' ? 'Add Expense' : 'Edit Expense'}
      </h1>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#FFFCF7',
          padding: 24,
          borderRadius: 16,
          boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
        }}
      >
        <label style={{ display: 'block', fontSize: 13, color: '#7A7064', marginBottom: 4 }}>Amount</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#1F1B16' }}>฿</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{
              flex: 1,
              fontSize: 36,
              fontWeight: 700,
              color: '#1F1B16',
              border: 'none',
              background: 'transparent',
              outline: 'none',
            }}
          />
        </div>

        <label style={{ display: 'block', fontSize: 13, color: '#7A7064', marginBottom: 4 }}>Category</label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={categoriesLoading}
          style={{
            width: '100%',
            fontSize: 15,
            padding: 8,
            background: '#EDE7DA',
            border: '1px solid rgba(31,27,22,0.04)',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <option value="">{categoriesLoading ? 'Loading categories...' : 'Select a category'}</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label style={{ display: 'block', fontSize: 13, color: '#7A7064', marginBottom: 4 }}>Description</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={255}
          style={{
            width: '100%',
            fontSize: 15,
            padding: 8,
            background: '#EDE7DA',
            border: '1px solid rgba(31,27,22,0.04)',
            borderRadius: 8,
            marginBottom: 16,
          }}
        />

        <label style={{ display: 'block', fontSize: 13, color: '#7A7064', marginBottom: 4 }}>Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{
            width: '100%',
            fontSize: 15,
            padding: 8,
            background: '#EDE7DA',
            border: '1px solid rgba(31,27,22,0.04)',
            borderRadius: 8,
            marginBottom: 16,
          }}
        />

        <label style={{ display: 'block', fontSize: 13, color: '#7A7064', marginBottom: 4 }}>Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          style={{
            width: '100%',
            fontSize: 15,
            padding: 8,
            background: '#EDE7DA',
            border: '1px solid rgba(31,27,22,0.04)',
            borderRadius: 8,
            marginBottom: 16,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />

        <LoadingButton
          type="submit"
          loading={saving}
          label={mode === 'create' ? 'Save Expense' : 'Save Changes'}
          loadingLabel="Saving..."
        />
        <InlineError message={error} />
      </form>
    </div>
  );
}
