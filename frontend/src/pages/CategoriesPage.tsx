import { useState, useEffect } from 'react';
import {
  Utensils, Car, Home, Book, Heart, Gamepad2, ShoppingBag, Zap,
  Briefcase, Gift, Coffee, Plane, Music, Dumbbell, Smartphone,
  Pencil, Trash2,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { Category } from '../api/categories';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/categories';

const ICON_NAMES = [
  'utensils',
  'car',
  'home',
  'book',
  'heart',
  'gamepad-2',
  'shopping-bag',
  'zap',
  'briefcase',
  'gift',
  'coffee',
  'plane',
  'music',
  'dumbbell',
  'smartphone',
];

const ICON_MAP: Record<string, ComponentType<{ size?: number }>> = {
  'utensils': Utensils,
  'car': Car,
  'home': Home,
  'book': Book,
  'heart': Heart,
  'gamepad-2': Gamepad2,
  'shopping-bag': ShoppingBag,
  'zap': Zap,
  'briefcase': Briefcase,
  'gift': Gift,
  'coffee': Coffee,
  'plane': Plane,
  'music': Music,
  'dumbbell': Dumbbell,
  'smartphone': Smartphone,
};

const COLOR_SWATCHES = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#F38181',
  '#AA96DA',
  '#FCBAD3',
  '#A8D8EA',
  '#C1D82F',
  '#999999',
  '#F7B731',
  '#26de81',
];

export default function CategoriesPage() {
  const [categories, setCategories]             = useState<Category[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [pageError, setPageError]               = useState<string | null>(null);
  const [modalOpen, setModalOpen]               = useState(false);
  const [editingCategory, setEditingCategory]   = useState<Category | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [deleteErrors, setDeleteErrors]         = useState<Record<number, string>>({});
  const [formName, setFormName]                 = useState('');
  const [formIcon, setFormIcon]                 = useState('utensils');
  const [formColor, setFormColor]               = useState('#FF6B6B');
  const [formLoading, setFormLoading]           = useState(false);
  const [formError, setFormError]               = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then(res => { if (!cancelled) setCategories(res.data.data); })
      .catch(() => { if (!cancelled) setPageError('Failed to load categories. Please refresh.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function openCreateModal() {
    setFormName('');
    setFormIcon('utensils');
    setFormColor('#FF6B6B');
    setEditingCategory(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setFormColor(cat.color);
    setEditingCategory(cat);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);
    const payload = { name: formName, icon: formIcon, color: formColor };
    try {
      if (editingCategory) {
        const res = await updateCategory(editingCategory.id, payload);
        setCategories(prev =>
          prev.map(c => (c.id === editingCategory.id ? res.data.data : c))
        );
      } else {
        const res = await createCategory(payload);
        setCategories(prev => [...prev, res.data.data]);
      }
      closeModal();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Something went wrong. Please try again.';
      setFormError(msg);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setConfirmingDelete(null);
    } catch (err) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })
        ?.response?.status;
      const msg =
        status === 422
          ? 'This category has expenses and cannot be deleted.'
          : ((err as { response?: { data?: { message?: string } } })
              ?.response?.data?.message ?? 'Something went wrong. Please try again.');
      setDeleteErrors(prev => ({ ...prev, [id]: msg }));
      // Do NOT call setConfirmingDelete(null) here — keep confirm UI open so
      // the error message remains visible to the user.
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Categories</h1>
        <button onClick={openCreateModal} style={{ padding: '0.5rem 1rem' }}>
          + Add Category
        </button>
      </div>

      {/* Page load error */}
      {pageError && (
        <p style={{ color: 'red', marginTop: '0.75rem' }} role="alert">
          {pageError}
        </p>
      )}

      {/* Loading state */}
      {loading && <p>Loading categories...</p>}

      {/* Empty state */}
      {!loading && !pageError && categories.length === 0 && (
        <div>
          <p><strong>No categories yet</strong></p>
          <p>Add your first category to start tracking expenses.</p>
        </div>
      )}

      {/* Card grid */}
      {!loading && categories.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {categories.map(cat => {
            const IconComponent = ICON_MAP[cat.icon] ?? Gift;
            const isConfirming = confirmingDelete === cat.id;
            return (
              <div
                key={cat.id}
                style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '1rem', backgroundColor: '#f5f5f5' }}
              >
                {/* Color swatch */}
                <div
                  style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: cat.color, marginBottom: '0.5rem' }}
                />
                {/* Icon */}
                <IconComponent size={20} />
                {/* Name */}
                <strong style={{ display: 'block', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                  {cat.name}
                </strong>
                {/* Action row */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => openEditModal(cat)}
                    aria-label="Edit category"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                  >
                    <Pencil size={16} />
                  </button>
                  {!isConfirming && (
                    <button
                      onClick={() => {
                        setConfirmingDelete(cat.id);
                        setDeleteErrors(prev => ({ ...prev, [cat.id]: '' }));
                      }}
                      aria-label="Delete category"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                {/* Inline delete confirm */}
                {isConfirming && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}>Delete "{cat.name}"?</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Yes, delete
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(null)}
                        style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                    {deleteErrors[cat.id] && (
                      <p style={{ color: 'red', marginTop: '0.5rem', fontSize: '0.875rem' }} role="alert">
                        {deleteErrors[cat.id]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '1.5rem',
              minWidth: '320px',
              maxWidth: '480px',
              width: '90%',
            }}
          >
            <h2 id="modal-title">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleSubmit}>
              {/* Name field */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="cat-name" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Name
                </label>
                <input
                  id="cat-name"
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
                />
              </div>
              {/* Color picker */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Color</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {COLOR_SWATCHES.map(hex => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Select color ${hex}`}
                      aria-pressed={formColor === hex}
                      onClick={() => setFormColor(hex)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '4px',
                        backgroundColor: hex,
                        border: 'none',
                        cursor: 'pointer',
                        outline: formColor === hex ? '3px solid #000' : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
              {/* Icon picker */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem' }}>Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ICON_NAMES.map(name => {
                    const IC = ICON_MAP[name];
                    return (
                      <button
                        key={name}
                        type="button"
                        aria-label={`Select icon ${name}`}
                        aria-pressed={formIcon === name}
                        onClick={() => setFormIcon(name)}
                        style={{
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid #e5e5e5',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: formIcon === name ? '#e5e5e5' : 'transparent',
                        }}
                      >
                        <IC size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Error */}
              {formError && (
                <p style={{ color: 'red', marginTop: '0.75rem' }} role="alert">
                  {formError}
                </p>
              )}
              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ padding: '0.5rem 1rem', cursor: formLoading ? 'not-allowed' : 'pointer' }}
                >
                  {formLoading ? 'Saving...' : 'Save Category'}
                </button>
                <button type="button" onClick={closeModal} style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
