import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listExpenses, deleteExpense } from "../api/expenses";
import { listCategories } from "../api/categories";
import type { Category } from "../api/categories";
import type { Expense, ExpenseFilters, ExpenseListMeta } from "../types/expense";
import CategoryChip from "../components/CategoryChip";
import Spinner from "../components/Spinner";
import { color } from "../theme";

const TH_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`;
}

function formatDayLong(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  return `${days[d.getDay()]} ${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`;
}

function formatTHB(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n));
}

interface TxnRowProps {
  expense: Expense;
  category?: Category;
  expanded: boolean;
  onToggle: () => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
}

function TxnRow({ expense, category, expanded, onToggle, onDelete, onEdit }: TxnRowProps) {
  const catName = category?.name ?? 'อื่นๆ';
  const apiColor = category?.color;
  return (
    <div style={{ borderBottom: `1px solid ${expanded ? 'transparent' : color.borderStrong}` }}>
      <button
        onClick={onToggle}
        style={{
          all: 'unset', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 4px', width: '100%', boxSizing: 'border-box',
        }}
      >
        <CategoryChip name={catName} apiColor={apiColor} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, color: color.text1, fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {expense.description}
          </div>
          <div style={{ fontSize: 13, color: color.text2, marginTop: 2 }}>
            {catName} · {formatDate(expense.date)}
          </div>
        </div>
        <div style={{
          fontSize: 17, fontWeight: 700, color: color.text1,
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
        }}>
          −฿{formatTHB(expense.amount)}
        </div>
        <div style={{
          color: color.text2, fontSize: 14, transition: 'transform 200ms',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0)',
        }}>›</div>
      </button>
      {expanded && (
        <div style={{ padding: '4px 4px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {expense.notes && (
            <div style={{ fontSize: 13, color: color.text2, paddingLeft: 56 }}>{expense.notes}</div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(expense.id); }}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '9px 16px', borderRadius: 10,
                background: color.surfaceAlt, color: color.text1,
                fontSize: 14, fontWeight: 600,
              }}
            >แก้ไข</button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('ลบรายการนี้ใช่ไหม?')) onDelete(expense.id);
              }}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '9px 16px', borderRadius: 10,
                background: color.expense + '14', color: color.expense,
                fontSize: 14, fontWeight: 600,
              }}
            >ลบรายการ</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBar({ total, count }: { total: number; count: number }) {
  return (
    <div style={{
      background: color.surface, borderRadius: 24, padding: 22,
      boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
      border: `1px solid ${color.border}`,
      marginBottom: 20,
    }}>
      <div style={{ fontSize: 14, color: color.text2, fontWeight: 500 }}>รายจ่ายทั้งหมด</div>
      <div style={{
        fontSize: 44, fontWeight: 800, color: color.text1,
        lineHeight: 1.05, marginTop: 6, letterSpacing: -1.2,
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span style={{ fontSize: 28, fontWeight: 600, color: color.text2, marginRight: 4 }}>฿</span>
        {formatTHB(total)}
      </div>
      <div style={{ fontSize: 13, color: color.text2, marginTop: 4 }}>{count} รายการ</div>
    </div>
  );
}

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [meta, setMeta] = useState<ExpenseListMeta>({ page: 1, per_page: 50, total: 0, last_page: 1 });
  const [filters] = useState<ExpenseFilters>({ page: 1, per_page: 50 } as ExpenseFilters & { per_page?: number });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listExpenses(filters)
      .then(r => {
        if (!cancelled) { setItems(r.items); setMeta(r.meta); setError(null); }
      })
      .catch(() => { if (!cancelled) setError('โหลดรายการไม่สำเร็จ กรุณาลองใหม่'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      setItems(prev => prev.filter(e => e.id !== id));
      setExpandedId(null);
    } catch {
      alert('ลบไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const catById = (id: number) => categories.find(c => c.id === id);

  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const total = items.reduce((s, e) => s + e.amount, 0);

  const groups: { date: string; items: Expense[] }[] = [];
  let lastDate: string | null = null;
  for (const e of sorted) {
    if (e.date !== lastDate) { groups.push({ date: e.date, items: [e] }); lastDate = e.date; }
    else groups[groups.length - 1].items.push(e);
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: color.text2, fontWeight: 500 }}>สวัสดี,</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: color.text1, marginTop: 2, letterSpacing: -0.4 }}>
            รายการค่าใช้จ่าย
          </div>
        </div>
        <button
          onClick={() => navigate('/expenses/new')}
          style={{
            all: 'unset', cursor: 'pointer',
            padding: '10px 18px', borderRadius: 12,
            background: color.accent, color: '#FFFCF7',
            fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >+ เพิ่มรายการ</button>
      </div>

      {loading && <Spinner />}

      {error && (
        <p style={{ color: color.danger, fontSize: 14, fontWeight: 500 }}>{error}</p>
      )}

      {!loading && !error && (
        <>
          <SummaryBar total={total} count={items.length} />

          {groups.length === 0 ? (
            <div style={{
              background: color.surface, borderRadius: 20, padding: 32,
              textAlign: 'center', color: color.text2, fontSize: 14,
              border: `1px solid ${color.border}`,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: color.text1, marginBottom: 8 }}>ยังไม่มีรายการ</div>
              <div>เริ่มต้นโดยเพิ่มรายการแรกของคุณ</div>
            </div>
          ) : groups.map(g => (
            <div key={g.date} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 12, color: color.text2, fontWeight: 600,
                letterSpacing: 0.4, padding: '8px 4px 6px',
              }}>{formatDayLong(g.date)}</div>
              <div style={{
                background: color.surface, borderRadius: 20, padding: '0 14px',
                border: `1px solid ${color.border}`,
                boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
              }}>
                {g.items.map((e) => (
                  <TxnRow
                    key={e.id}
                    expense={e}
                    category={catById(e.category_id)}
                    expanded={expandedId === e.id}
                    onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
                    onDelete={handleDelete}
                    onEdit={(id) => navigate(`/expenses/${id}/edit`)}
                  />
                ))}
              </div>
            </div>
          ))}

          {meta.last_page > 1 && (
            <div style={{ textAlign: 'center', color: color.text2, fontSize: 13, padding: '16px 0' }}>
              แสดง {items.length} จาก {meta.total} รายการ
            </div>
          )}
        </>
      )}
    </div>
  );
}
