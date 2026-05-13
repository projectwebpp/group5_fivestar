import { useState } from 'react';
import type { ExpenseFilters } from '../types/expense';
import type { Category } from '../api/categories';

interface FilterBarProps {
  open: boolean;
  onToggle: () => void;
  filters: ExpenseFilters;
  onApply: (f: ExpenseFilters) => void;
  categories: Category[];
}

export default function FilterBar({ open, onToggle, filters, onApply, categories }: FilterBarProps) {
  const [draft, setDraft] = useState<ExpenseFilters>(filters);

  const handleApply = () => {
    onApply(draft);
  };

  const handleClear = () => {
    setDraft({ page: 1 });
    onApply({ page: 1 });
  };

  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          padding: 8,
          background: '#EDE7DA',
          border: 'none',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 400,
          cursor: 'pointer',
        }}
      >
        {open ? 'Hide Filters' : 'Filters'}
      </button>

      {open && (
        <div
          style={{
            background: '#EDE7DA',
            padding: 16,
            borderRadius: 12,
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <label style={{ fontSize: 13, color: '#7A7064' }}>
            From
            <input
              type="date"
              value={draft.date_from ?? ''}
              onChange={(e) => setDraft(d => ({ ...d, date_from: e.target.value || undefined }))}
              style={{ display: 'block', width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.1)', fontSize: 14, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 13, color: '#7A7064' }}>
            To
            <input
              type="date"
              value={draft.date_to ?? ''}
              onChange={(e) => setDraft(d => ({ ...d, date_to: e.target.value || undefined }))}
              style={{ display: 'block', width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.1)', fontSize: 14, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 13, color: '#7A7064' }}>
            Min ฿
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.amount_min ?? ''}
              onChange={(e) => setDraft(d => ({ ...d, amount_min: e.target.value === '' ? '' : Number(e.target.value) }))}
              style={{ display: 'block', width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.1)', fontSize: 14, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 13, color: '#7A7064' }}>
            Max ฿
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.amount_max ?? ''}
              onChange={(e) => setDraft(d => ({ ...d, amount_max: e.target.value === '' ? '' : Number(e.target.value) }))}
              style={{ display: 'block', width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.1)', fontSize: 14, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 13, color: '#7A7064' }}>
            Category
            <select
              value={draft.category_id ?? ''}
              onChange={(e) => setDraft(d => ({ ...d, category_id: e.target.value === '' ? '' : Number(e.target.value) }))}
              style={{ display: 'block', width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.1)', fontSize: 14, marginTop: 4, background: '#EDE7DA' }}
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleApply}
              style={{
                padding: '8px 16px',
                background: 'oklch(48% 0.10 195)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '8px 16px',
                background: '#EDE7DA',
                color: '#7A7064',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
