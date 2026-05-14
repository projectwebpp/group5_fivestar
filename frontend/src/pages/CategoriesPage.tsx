import { useEffect, useState } from 'react';
import { listCategories, createCategory, deleteCategory } from '../api/categories';
import type { Category } from '../api/categories';
import CategoryChip from '../components/CategoryChip';
import Spinner from '../components/Spinner';
import { color } from '../theme';

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCategories()
      .then(setCats)
      .catch(() => setError('โหลดหมวดหมู่ไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await createCategory({ name: newName.trim(), icon: 'other', color: color.text2 });
      const updated = await listCategories();
      setCats(updated);
      setNewName('');
      setAdding(false);
    } catch {
      setError('เพิ่มหมวดหมู่ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('ลบหมวดหมู่นี้ใช่ไหม?')) return;
    try {
      await deleteCategory(id);
      setCats(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('ลบหมวดหมู่ไม่สำเร็จ');
    }
  }

  const card = {
    background: color.surface, borderRadius: 20,
    border: `1px solid ${color.border}`,
    boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: color.text1, letterSpacing: -0.4 }}>หมวดหมู่</div>
          <div style={{ fontSize: 14, color: color.text2, marginTop: 2 }}>จัดการหมวดหมู่ค่าใช้จ่าย</div>
        </div>
        <button
          onClick={() => setAdding(v => !v)}
          style={{
            all: 'unset', cursor: 'pointer',
            padding: '10px 18px', borderRadius: 12,
            background: color.accent, color: '#FFFCF7',
            fontSize: 14, fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >+ เพิ่มหมวดหมู่</button>
      </div>

      {error && <p style={{ color: color.danger, fontSize: 14, marginBottom: 16 }}>{error}</p>}

      {adding && (
        <div style={{ ...card, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: color.text1, marginBottom: 12 }}>หมวดหมู่ใหม่</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="ชื่อหมวดหมู่…"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setAdding(false); setNewName(''); } }}
              style={{
                all: 'unset', flex: 1, fontSize: 15, color: color.text1,
                background: color.surfaceAlt, padding: '11px 14px', borderRadius: 12,
                border: `1.5px solid ${color.borderStrong}`,
              }}
            />
            <button
              onClick={handleCreate} disabled={!newName.trim() || saving}
              style={{
                all: 'unset', cursor: newName.trim() && !saving ? 'pointer' : 'not-allowed',
                padding: '11px 18px', borderRadius: 12,
                background: newName.trim() ? color.accent : color.surfaceAlt,
                color: newName.trim() ? '#FFFCF7' : color.text2,
                fontSize: 14, fontWeight: 600, opacity: saving ? 0.6 : 1,
              }}
            >{saving ? 'กำลังบันทึก…' : 'บันทึก'}</button>
            <button
              onClick={() => { setAdding(false); setNewName(''); }}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '11px 14px', borderRadius: 12,
                background: color.surfaceAlt, color: color.text2,
                fontSize: 14, fontWeight: 600,
              }}
            >ยกเลิก</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div style={{ ...card, overflow: 'hidden' }}>
          {cats.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: color.text2 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: color.text1, marginBottom: 8 }}>ยังไม่มีหมวดหมู่</div>
              <div style={{ fontSize: 14 }}>เริ่มต้นโดยเพิ่มหมวดหมู่แรกของคุณ</div>
            </div>
          ) : cats.map((c, i) => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 18px',
              borderBottom: i < cats.length - 1 ? `1px solid ${color.borderStrong}` : 'none',
            }}>
              <CategoryChip name={c.name} apiColor={c.color} size={42} />
              <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: color.text1 }}>{c.name}</div>
              <button
                onClick={() => handleDelete(c.id)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '8px 14px', borderRadius: 10,
                  background: color.expense + '14', color: color.expense,
                  fontSize: 13, fontWeight: 600,
                }}
              >ลบ</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
