import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createExpense, updateExpense, getExpense } from '../api/expenses';
import { listCategories } from '../api/categories';
import type { Category } from '../api/categories';
import InlineError from '../components/InlineError';
import LoadingButton from '../components/LoadingButton';
import Spinner from '../components/Spinner';
import { color, font, radius, shadow } from '../theme';

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: color.text2, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = (focused: boolean): React.CSSProperties => ({
  display: 'block',
  width: '100%',
  fontSize: 14,
  padding: '10px 14px',
  background: color.surface,
  border: `1.5px solid ${focused ? color.accent : color.border}`,
  borderRadius: radius.md,
  outline: focused ? `3px solid ${color.accentLight}` : 'none',
  color: color.text1,
  fontFamily: font,
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
});

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

  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    if (mode === 'edit' && !id) { setError('Invalid expense ID.'); return; }
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
      setError(
        e?.response?.data?.errors?.[0]?.message ??
        e?.response?.data?.message ??
        'Something went wrong. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingExpense) return <Spinner fullPage />;

  return (
    <div style={{ fontFamily: font, minHeight: '100vh', background: color.bg, paddingBottom: 64 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px' }}>

        <button
          onClick={() => navigate('/expenses')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            fontSize: 13,
            fontWeight: 500,
            color: color.text2,
            cursor: 'pointer',
            padding: 0,
            marginBottom: 24,
            fontFamily: font,
          }}
        >
          ← Back to Expenses
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: color.text1, margin: '0 0 24px', letterSpacing: '-0.5px' }}>
          {mode === 'create' ? 'Add Expense' : 'Edit Expense'}
        </h1>

        <form
          onSubmit={handleSubmit}
          style={{
            background: color.surface,
            padding: 28,
            borderRadius: radius.xl,
            boxShadow: shadow.md,
            border: `1px solid ${color.border}`,
          }}
        >
          {/* Amount */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: color.text2, marginBottom: 8 }}>
              Amount
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                background: color.surfaceAlt,
                borderRadius: radius.lg,
                border: `1.5px solid ${focusedField === 'amount' ? color.accent : 'transparent'}`,
                transition: 'border-color 0.15s',
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700, color: color.text3, lineHeight: 1 }}>฿</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onFocus={() => setFocusedField('amount')}
                onBlur={() => setFocusedField(null)}
                placeholder="0.00"
                style={{
                  flex: 1,
                  fontSize: 32,
                  fontWeight: 700,
                  color: color.text1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontFamily: font,
                }}
              />
            </div>
          </div>

          <FormField label="Category">
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={categoriesLoading}
              onFocus={() => setFocusedField('category')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle(focusedField === 'category'),
                appearance: 'none',
              }}
            >
              <option value="">{categoriesLoading ? 'Loading…' : 'Select a category'}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>

          <FormField label="Description">
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={255}
              placeholder="e.g. Lunch at café"
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle(focusedField === 'description')}
            />
          </FormField>

          <FormField label="Date">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              onFocus={() => setFocusedField('date')}
              onBlur={() => setFocusedField(null)}
              style={inputStyle(focusedField === 'date')}
            />
          </FormField>

          <FormField label="Notes (optional)">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Any additional notes…"
              onFocus={() => setFocusedField('notes')}
              onBlur={() => setFocusedField(null)}
              style={{
                ...inputStyle(focusedField === 'notes'),
                resize: 'vertical',
                minHeight: 80,
              }}
            />
          </FormField>

          <InlineError message={error} />

          <div style={{ marginTop: 24 }}>
            <LoadingButton
              type="submit"
              loading={saving}
              fullWidth
              label={mode === 'create' ? 'Save Expense' : 'Save Changes'}
              loadingLabel="Saving…"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
