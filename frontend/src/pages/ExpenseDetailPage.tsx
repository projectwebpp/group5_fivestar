import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getExpense, deleteExpense } from '../api/expenses';
import { listCategories } from '../api/categories';
import type { Category } from '../api/categories';
import type { Expense } from '../types/expense';
import Spinner from '../components/Spinner';
import CategoryChip from '../components/CategoryChip';
import { color } from '../theme';

const TH_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

function formatTHB(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

function formatFullDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  return `${days[d.getDay()]} ${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
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
      .catch(() => setError('โหลดรายการไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [id]);

  async function confirmDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteExpense(Number(id));
      navigate('/expenses');
    } catch {
      setError('ลบไม่สำเร็จ กรุณาลองใหม่');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) return <Spinner fullPage />;

  if (error || !expense) {
    return <div style={{ padding: 24, color: color.danger }}>{error ?? 'ไม่พบรายการ'}</div>;
  }

  const cat = categories.find(c => c.id === expense.category_id);

  const card = {
    background: color.surface, borderRadius: 20, padding: 22,
    border: `1px solid ${color.border}`,
    boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Back */}
      <button
        onClick={() => navigate('/expenses')}
        style={{
          all: 'unset', cursor: 'pointer',
          width: 40, height: 40, borderRadius: 12,
          background: color.surfaceAlt, color: color.text1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, lineHeight: 1, flexShrink: 0, alignSelf: 'flex-start',
        }}
      >←</button>

      {/* Amount hero */}
      <div style={{ ...card, textAlign: 'center', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <CategoryChip name={cat?.name ?? 'อื่นๆ'} apiColor={cat?.color} size={64} />
        </div>
        <div style={{ fontSize: 13, color: color.text2, marginBottom: 4 }}>จำนวนเงิน</div>
        <div style={{ fontSize: 44, fontWeight: 800, color: color.expense, letterSpacing: -1.2, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 28, fontWeight: 600, color: color.text2, marginRight: 4 }}>฿</span>
          {formatTHB(expense.amount)}
        </div>
      </div>

      {/* Details */}
      <div style={{ ...card }}>
        {[
          { label: 'รายละเอียด', value: expense.description },
          { label: 'หมวดหมู่', value: cat?.name ?? `หมวดหมู่ #${expense.category_id}` },
          { label: 'วันที่', value: formatFullDate(expense.date) },
          ...(expense.notes ? [{ label: 'โน้ต', value: expense.notes }] : []),
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            padding: '14px 0',
            borderBottom: i < arr.length - 1 ? `1px solid ${color.borderStrong}` : 'none',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: color.text2, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              {row.label}
            </div>
            <div style={{ fontSize: 15, color: color.text1, fontWeight: 500 }}>{row.value}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Link
          to={`/expenses/${expense.id}/edit`}
          style={{
            flex: 1, textAlign: 'center', padding: '13px 16px',
            background: color.accent, color: '#FFFCF7', fontWeight: 600,
            fontSize: 15, borderRadius: 14, textDecoration: 'none',
          }}
        >แก้ไข</Link>
        {!showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              flex: 1, padding: '13px 16px',
              background: color.expense + '14', color: color.expense,
              fontWeight: 600, fontSize: 15, border: 'none',
              borderRadius: 14, cursor: 'pointer',
            }}
          >ลบรายการ</button>
        )}
      </div>

      {showDeleteConfirm && (
        <div style={{ ...card, background: color.dangerLight }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: color.text1, margin: '0 0 14px' }}>
            ลบรายการนี้ใช่ไหม? ไม่สามารถย้อนกลับได้
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={confirmDelete} disabled={deleting}
              style={{
                flex: 1, padding: '11px 16px', background: color.expense,
                color: '#FFFCF7', fontWeight: 600, fontSize: 14, border: 'none',
                borderRadius: 12, cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}
            >{deleting ? 'กำลังลบ…' : 'ยืนยันลบ'}</button>
            <button
              onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
              style={{
                flex: 1, padding: '11px 16px', background: color.surface,
                color: color.text1, fontWeight: 600, fontSize: 14,
                border: `1.5px solid ${color.borderStrong}`, borderRadius: 12, cursor: 'pointer',
              }}
            >ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}
