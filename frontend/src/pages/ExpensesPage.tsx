import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listExpenses } from '../api/expenses';
import type { Expense, ExpenseFilters, ExpenseListMeta } from '../types/expense';
import ExpenseCard from '../components/ExpenseCard';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [meta, setMeta] = useState<ExpenseListMeta>({ page: 1, per_page: 10, total: 0, last_page: 1 });
  const [filters, setFilters] = useState<ExpenseFilters>({ page: 1 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ExpenseFilters>({ page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listExpenses(appliedFilters)
      .then(r => { if (!cancelled) { setItems(r.items); setMeta(r.meta); setError(null); } })
      .catch(() => { if (!cancelled) setError('Failed to load expenses. Please try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [appliedFilters]);

  const isFiltered = !!(
    appliedFilters.category_id ||
    appliedFilters.date_from ||
    appliedFilters.date_to ||
    appliedFilters.amount_min ||
    appliedFilters.amount_max
  );

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4EFE6', padding: '24px', paddingBottom: 48 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', margin: 0 }}>Expenses</h1>
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
      </header>

      <FilterBar
        open={filtersOpen}
        onToggle={() => setFiltersOpen(o => !o)}
        filters={filters}
        onApply={(f) => { setFilters(f); setAppliedFilters({ ...f, page: 1 }); }}
      />

      <div style={{ marginTop: 32 }}>
        {loading && <p style={{ color: '#7A7064', fontSize: 15 }}>Loading expenses...</p>}
        {error && <p style={{ color: '#C0392B', fontSize: 14 }}>{error}</p>}
        {!loading && !error && items.length === 0 && <EmptyState filtered={isFiltered} />}
        {!loading && !error && items.length > 0 && items.map(e => (
          <ExpenseCard key={e.id} expense={e} onClick={() => navigate(`/expenses/${e.id}`)} />
        ))}
      </div>

      {!loading && meta.total > 0 && (
        <Pagination
          page={meta.page}
          totalPages={meta.last_page}
          onPrev={() => setAppliedFilters(a => ({ ...a, page: Math.max(1, (a.page ?? 1) - 1) }))}
          onNext={() => setAppliedFilters(a => ({ ...a, page: Math.min(meta.last_page, (a.page ?? 1) + 1) }))}
        />
      )}
    </div>
  );
}
