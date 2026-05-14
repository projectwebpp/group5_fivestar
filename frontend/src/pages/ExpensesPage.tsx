import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listExpenses } from "../api/expenses";
import { listCategories } from "../api/categories";
import type { Category } from "../api/categories";
import type {
  Expense,
  ExpenseFilters,
  ExpenseListMeta,
} from "../types/expense";
import ExpenseCard from "../components/ExpenseCard";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import EmptyState from "../components/EmptyState";
import Header from "../components/Header";
import Spinner from "../components/Spinner";
import { color, font } from "../theme";

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [meta, setMeta] = useState<ExpenseListMeta>({
    page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });
  const [filters, setFilters] = useState<ExpenseFilters>({ page: 1 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ExpenseFilters>({
    page: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => {
        /* non-critical */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listExpenses(appliedFilters)
      .then((r) => {
        if (!cancelled) {
          setItems(r.items);
          setMeta(r.meta);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load expenses. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [appliedFilters]);

  const isFiltered = !!(
    appliedFilters.category_id ||
    appliedFilters.date_from ||
    appliedFilters.date_to ||
    appliedFilters.amount_min ||
    appliedFilters.amount_max
  );

  return (
    <div
      style={{
        fontFamily: font,
        minHeight: "100vh",
        background: color.bg,
        paddingBottom: 64,
      }}
    >
      <Header title="Expenses" />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <FilterBar
          open={filtersOpen}
          onToggle={() => setFiltersOpen((o) => !o)}
          filters={filters}
          onApply={(f) => {
            setFilters(f);
            setAppliedFilters({ ...f, page: 1 });
          }}
          categories={categories}
        />

        <div style={{ marginTop: 16 }}>
          {loading && <Spinner />}
          {error && (
            <p style={{ color: color.danger, fontSize: 14, fontWeight: 500 }}>
              {error}
            </p>
          )}
          {!loading && !error && items.length === 0 && (
            <EmptyState filtered={isFiltered} />
          )}
          {!loading &&
            !error &&
            items.length > 0 &&
            items.map((e) => (
              <ExpenseCard
                key={e.id}
                expense={e}
                onClick={() => navigate(`/expenses/${e.id}`)}
                categoryName={
                  categories.find((c) => c.id === e.category_id)?.name
                }
              />
            ))}
        </div>

        {!loading && meta.total > 0 && (
          <Pagination
            page={meta.page}
            totalPages={meta.last_page}
            onPrev={() =>
              setAppliedFilters((a) => ({
                ...a,
                page: Math.max(1, (a.page ?? 1) - 1),
              }))
            }
            onNext={() =>
              setAppliedFilters((a) => ({
                ...a,
                page: Math.min(meta.last_page, (a.page ?? 1) + 1),
              }))
            }
          />
        )}
      </div>
    </div>
  );
}
