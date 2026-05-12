import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getAnalyticsSummary } from '../api/analytics';
import type { AnalyticsSummary, CategoryBreakdown } from '../types/analytics';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['#4E79A7', '#F28E2B', '#59A14F', '#E15759', '#76B7B2', '#EDC948', '#B07AA1', '#FF9DA7'];

// ─── Date preset helpers ───────────────────────────────────────────────────────

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getPresetDates(preset: 'this-month' | 'last-month' | 'last-3-months'): { from: string; to: string } {
  const now = new Date();
  if (preset === 'this-month') {
    return {
      from: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: toISO(now),
    };
  }
  if (preset === 'last-month') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last  = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toISO(first), to: toISO(last) };
  }
  // last-3-months
  const first = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  return { from: toISO(first), to: toISO(now) };
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface AnalyticsFilterBarProps {
  dateFrom: string;
  dateTo: string;
  activePreset: string | null;
  loading: boolean;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onPreset: (preset: 'this-month' | 'last-month' | 'last-3-months') => void;
  onApply: () => void;
}

function AnalyticsFilterBar({
  dateFrom, dateTo, activePreset, loading,
  onDateFromChange, onDateToChange, onPreset, onApply,
}: AnalyticsFilterBarProps) {
  const presets: { id: 'this-month' | 'last-month' | 'last-3-months'; label: string }[] = [
    { id: 'this-month',    label: 'This Month' },
    { id: 'last-month',   label: 'Last Month' },
    { id: 'last-3-months', label: 'Last 3 Months' },
  ];

  return (
    <div style={{
      background: '#EDE7DA', padding: 16, borderRadius: 12, marginBottom: 24,
      display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 8,
    }}>
      {presets.map(p => (
        <button
          key={p.id}
          onClick={() => onPreset(p.id)}
          style={{
            padding: '8px 12px',
            background: activePreset === p.id ? 'oklch(48% 0.10 195)' : '#EDE7DA',
            color: activePreset === p.id ? '#fff' : '#7A7064',
            fontWeight: activePreset === p.id ? 700 : 400,
            fontSize: 13,
            border: '1px solid rgba(31,27,22,0.1)',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          {p.label}
        </button>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, color: '#7A7064' }}>
          From
          <input
            type="date"
            value={dateFrom}
            onChange={e => { onDateFromChange(e.target.value); }}
            style={{ display: 'block', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.1)', fontSize: 14, marginTop: 4 }}
          />
        </label>
        <label style={{ fontSize: 13, color: '#7A7064' }}>
          To
          <input
            type="date"
            value={dateTo}
            onChange={e => { onDateToChange(e.target.value); }}
            style={{ display: 'block', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(31,27,22,0.1)', fontSize: 14, marginTop: 4 }}
          />
        </label>
      </div>
      <button
        onClick={onApply}
        disabled={loading}
        style={{
          padding: '8px 16px',
          background: 'oklch(48% 0.10 195)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 15,
          border: 'none',
          borderRadius: 12,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        Apply
      </button>
    </div>
  );
}

function SummaryCards({ data }: { data: AnalyticsSummary }) {
  const cards = [
    { label: 'Total Expenses',  value: data.total },
    { label: 'Daily Average',   value: data.daily_avg },
    { label: 'Monthly Average', value: data.monthly_avg },
  ];
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      {cards.map(card => (
        <div
          key={card.label}
          style={{
            flex: 1,
            minWidth: 120,
            background: '#FFFCF7',
            borderRadius: 12,
            padding: '16px 24px',
            boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
            border: '1px solid rgba(31,27,22,0.04)',
          }}
        >
          <p style={{ fontSize: 13, color: '#7A7064', margin: '0 0 4px' }}>{card.label}</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', margin: 0 }}>
            ฿{card.value.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}

function CategoryPieChart({ data }: { data: CategoryBreakdown[] }) {
  return (
    <div style={{
      background: '#FFFCF7',
      borderRadius: 16,
      padding: 24,
      boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
      border: '1px solid rgba(31,27,22,0.04)',
    }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#1F1B16', marginBottom: 16, marginTop: 0 }}>
        Spending by Category
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="percentage"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            innerRadius={0}
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string, props: { payload: CategoryBreakdown }) =>
              [`฿${props.payload.total.toFixed(2)} (${value}%)`, name]
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function AnalyticsEmptyState() {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', marginBottom: 12 }}>
        No expenses for this period
      </h2>
      <p style={{ fontSize: 15, color: '#7A7064', marginBottom: 24 }}>
        Try selecting a different date range, or add some expenses first.
      </p>
      <Link
        to="/expenses/new"
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
        Add Expense
      </Link>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const today = new Date();
  const defaultFrom = toISO(new Date(today.getFullYear(), today.getMonth(), 1));
  const defaultTo   = toISO(today);

  const [dateFrom,     setDateFrom]     = useState(defaultFrom);
  const [dateTo,       setDateTo]       = useState(defaultTo);
  const [activePreset, setActivePreset] = useState<string | null>('this-month');
  const [data,         setData]         = useState<AnalyticsSummary | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const fetchData = (from: string, to: string) => {
    setLoading(true);
    setError(null);
    getAnalyticsSummary(from, to)
      .then(d => setData(d))
      .catch(() => setError('Failed to load analytics. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData(defaultFrom, defaultTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    setActivePreset(null);
    fetchData(dateFrom, dateTo);
  };

  const handlePreset = (preset: 'this-month' | 'last-month' | 'last-3-months') => {
    const { from, to } = getPresetDates(preset);
    setDateFrom(from);
    setDateTo(to);
    setActivePreset(preset);
    fetchData(from, to);
  };

  const handleDateFromChange = (v: string) => {
    setDateFrom(v);
    setActivePreset(null);
  };

  const handleDateToChange = (v: string) => {
    setDateTo(v);
    setActivePreset(null);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#F4EFE6', padding: '24px', paddingBottom: 48 }}>

      {/* Header + nav */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F1B16', margin: 0 }}>Analytics</h1>
        <nav style={{ display: 'flex', gap: 16 }}>
          <Link to="/expenses" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064', textDecoration: 'none' }}>
            Expenses
          </Link>
          <Link to="/analytics" style={{ fontSize: 15, fontWeight: 700, color: 'oklch(48% 0.10 195)', textDecoration: 'none' }}>
            Analytics
          </Link>
          <Link to="/budget" style={{ fontSize: 15, fontWeight: 700, color: '#7A7064', textDecoration: 'none' }}>
            Budget
          </Link>
        </nav>
      </header>

      {/* Filter bar */}
      <AnalyticsFilterBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        activePreset={activePreset}
        loading={loading}
        onDateFromChange={handleDateFromChange}
        onDateToChange={handleDateToChange}
        onPreset={handlePreset}
        onApply={handleApply}
      />

      {/* Error (non-blocking — show above results if present) */}
      {error && <p style={{ color: '#C0392B', fontSize: 14, marginBottom: 16 }}>{error}</p>}

      {/* Loading state */}
      {loading && <p style={{ color: '#7A7064', fontSize: 15 }}>Loading analytics...</p>}

      {/* Results */}
      {!loading && data && (
        <>
          <SummaryCards data={data} />
          {data.category_breakdown.length === 0 ? (
            <AnalyticsEmptyState />
          ) : (
            <CategoryPieChart data={data.category_breakdown} />
          )}
        </>
      )}
    </div>
  );
}
