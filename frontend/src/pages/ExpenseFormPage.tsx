import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createExpense, updateExpense, getExpense } from '../api/expenses';
import { listCategories } from '../api/categories';
import type { Category } from '../api/categories';
import Spinner from '../components/Spinner';
import CategoryChip, { getCategoryStyle } from '../components/CategoryChip';
import { color } from '../theme';

function tap(prev: string, k: string): string {
  if (k === 'del') return prev.slice(0, -1);
  if (k === '.' && prev.includes('.')) return prev;
  if (k === '.' && prev === '') return '0.';
  if (prev.includes('.')) {
    const [, frac = ''] = prev.split('.');
    if (frac.length >= 2) return prev;
  }
  if (prev === '0' && k !== '.') return k;
  return prev + k;
}

function useIsDesktop() {
  const [v, setV] = useState(() => window.innerWidth >= 960);
  useEffect(() => {
    const h = () => setV(window.innerWidth >= 960);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return v;
}

export default function ExpenseFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(mode === 'edit');

  useEffect(() => {
    listCategories()
      .then(cats => { setCategories(cats); if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id); })
      .catch(() => setError('โหลดหมวดหมู่ไม่สำเร็จ'))
      .finally(() => setCatsLoading(false));
  }, []);

  useEffect(() => {
    if (mode === 'edit' && id) {
      setLoadingExpense(true);
      getExpense(Number(id))
        .then(e => {
          setAmount(e.amount.toString());
          setCategoryId(e.category_id);
          setDescription(e.description);
          setDate(e.date);
          setNotes(e.notes ?? '');
        })
        .catch(() => setError('โหลดรายการไม่สำเร็จ'))
        .finally(() => setLoadingExpense(false));
    }
  }, [mode, id]);

  const num = parseFloat(amount) || 0;
  const canSave = num > 0 && categoryId != null && description.trim().length > 0;

  async function handleSave() {
    if (!canSave) { setError('กรุณากรอกจำนวนเงิน หมวดหมู่ และรายละเอียด'); return; }
    if (mode === 'edit' && !id) { setError('ไม่พบรายการ'); return; }
    const v = !/^\d+(\.\d{1,2})?$/.test(amount) ? 'จำนวนเงินไม่เกิน 2 ทศนิยม' : null;
    if (v) { setError(v); return; }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        amount: num,
        category_id: categoryId!,
        description: description.trim(),
        date,
        notes: notes.trim() || undefined,
      };
      if (mode === 'create') await createExpense(payload as Parameters<typeof createExpense>[0]);
      else await updateExpense(Number(id), payload);
      navigate('/expenses');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: Array<{ message: string }>; message?: string } } };
      setError(e?.response?.data?.errors?.[0]?.message ?? e?.response?.data?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  if (loadingExpense) return <Spinner fullPage />;

  const card = {
    background: color.surface, borderRadius: 20, border: `1px solid ${color.border}`,
    boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
  };

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto',
      padding: isDesktop ? '8px 0 64px' : '8px 0 120px',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px' }}>
        <button
          onClick={() => navigate('/expenses')}
          style={{
            all: 'unset', cursor: 'pointer',
            width: 40, height: 40, borderRadius: 12,
            background: color.surfaceAlt, color: color.text1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, lineHeight: 1, flexShrink: 0,
          }}
        >←</button>
        <div style={{
          fontSize: isDesktop ? 26 : 22, fontWeight: 700, color: color.text1, letterSpacing: -0.4,
        }}>
          {mode === 'create' ? 'เพิ่มรายการใหม่' : 'แก้ไขรายการ'}
        </div>
      </div>

      {/* Amount */}
      <div style={{ ...card, padding: '24px 24px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: color.text2, marginBottom: 6, letterSpacing: 0.2 }}>
          จำนวนเงิน (บาท)
        </div>
        {isDesktop ? (
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 600, color: color.text2 }}>฿</span>
            <input
              type="number" inputMode="decimal" placeholder="0"
              value={amount} onChange={e => setAmount(e.target.value)}
              style={{
                all: 'unset', textAlign: 'center', maxWidth: 320,
                fontSize: 56, fontWeight: 800, color: color.text1,
                letterSpacing: -2, lineHeight: 1.1,
                fontVariantNumeric: 'tabular-nums',
                borderBottom: `2px solid ${color.borderStrong}`,
                paddingBottom: 4,
              }}
            />
          </div>
        ) : (
          <div style={{
            fontSize: 56, fontWeight: 800, color: amount ? color.text1 : color.text2,
            letterSpacing: -1.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: 30, fontWeight: 600, marginRight: 4, color: color.text2 }}>฿</span>
            {amount || '0'}
          </div>
        )}
      </div>

      {/* Category grid */}
      {catsLoading ? (
        <Spinner />
      ) : (
        <div style={{ ...card, padding: 22 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: color.text1, marginBottom: 14 }}>หมวดหมู่</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(80px, 1fr))' : 'repeat(4, 1fr)',
            gap: 10,
          }}>
            {categories.map(c => {
              const active = categoryId === c.id;
              const style = getCategoryStyle(c.name, c.color);
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  style={{
                    all: 'unset', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '12px 4px', borderRadius: 14,
                    background: active ? style.bg : 'transparent',
                    border: `1.5px solid ${active ? style.color : 'transparent'}`,
                    transition: 'all 160ms ease',
                    boxSizing: 'border-box',
                  }}
                >
                  <CategoryChip name={c.name} apiColor={c.color} size={42} />
                  <div style={{
                    fontSize: 12, color: color.text1, fontWeight: active ? 600 : 500,
                    textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', maxWidth: '100%',
                  }}>{c.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Description + Date + Notes */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '14px 18px',
          borderBottom: `1px solid ${color.borderStrong}`,
        }}>
          <div style={{ fontSize: 15, color: color.text1, fontWeight: 500, flex: 1 }}>รายละเอียด</div>
          <input
            type="text" value={description} onChange={e => setDescription(e.target.value)}
            placeholder="พิมพ์รายละเอียด…"
            maxLength={255}
            style={{
              all: 'unset', flex: 2, fontSize: 15, color: color.text1,
              textAlign: 'right', minWidth: 0,
            }}
          />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '14px 18px',
          borderBottom: `1px solid ${color.borderStrong}`,
        }}>
          <div style={{ fontSize: 15, color: color.text1, fontWeight: 500, flex: 1 }}>วันที่</div>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{
              all: 'unset', fontSize: 15, color: color.text1, textAlign: 'right',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px' }}>
          <div style={{ fontSize: 15, color: color.text1, fontWeight: 500, marginRight: 12, flexShrink: 0 }}>โน้ต</div>
          <input
            type="text" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม… (ไม่บังคับ)"
            style={{
              all: 'unset', flex: 1, fontSize: 15, color: color.text1,
              textAlign: 'right', minWidth: 0,
            }}
          />
        </div>
      </div>

      {/* Mobile numeric keypad */}
      {!isDesktop && (
        <div style={{ ...card, padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => (
              <button
                key={k}
                onClick={() => setAmount(prev => tap(prev, k))}
                style={{
                  all: 'unset', cursor: 'pointer',
                  textAlign: 'center', padding: '14px 0',
                  borderRadius: 12, background: color.surfaceAlt, color: color.text1,
                  fontSize: 22, fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >{k === 'del' ? '⌫' : k}</button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 12,
          background: color.dangerLight, color: color.danger,
          fontSize: 14, fontWeight: 500,
        }}>{error}</div>
      )}

      {/* Save button */}
      <button
        onClick={() => handleSave()}
        disabled={!canSave || saving}
        style={{
          all: 'unset', cursor: (canSave && !saving) ? 'pointer' : 'not-allowed',
          textAlign: 'center', padding: isDesktop ? '18px 0' : '16px 0',
          borderRadius: 16,
          background: (canSave && !saving) ? color.accent : color.surfaceAlt,
          color: (canSave && !saving) ? '#FFFCF7' : color.text2,
          fontSize: isDesktop ? 17 : 16, fontWeight: 700,
          opacity: (canSave && !saving) ? 1 : 0.6,
          boxShadow: (canSave && !saving) ? '0 8px 20px rgba(0,0,0,0.12)' : 'none',
          transition: 'all 160ms ease',
        }}
      >{saving ? 'กำลังบันทึก…' : 'บันทึกรายการ'}</button>
    </div>
  );
}
