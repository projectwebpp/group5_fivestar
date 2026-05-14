import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { logout } from '../api/auth';
import { exportExpenses } from '../api/expenses';
import { color, font, shadow } from '../theme';

const NAV = [
  { to: '/expenses',  label: 'Expenses'  },
  { to: '/analytics', label: 'Analytics' },
  { to: '/budget',    label: 'Budget'    },
  { to: '/recurring', label: 'Recurring' },
];

export default function Header({ title }: { title: string }) {
  const navigate       = useNavigate();
  const { pathname }   = useLocation();
  const [exporting, setExporting] = useState(false);
  const [exportErr, setExportErr] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportErr(null);
    try { await exportExpenses(); }
    catch { setExportErr('Export failed. Please try again.'); }
    finally { setExporting(false); }
  }

  async function handleLogout() {
    try { await logout(); } catch { /* ignore */ }
    localStorage.removeItem('auth_token');
    navigate('/auth');
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${color.border}`,
          boxShadow: shadow.sm,
          fontFamily: font,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          {/* Brand */}
          <span style={{ fontSize: 18, fontWeight: 800, color: color.text1, letterSpacing: '-0.5px', flexShrink: 0 }}>
            💰 {title}
          </span>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 4 }}>
            {NAV.map(({ to, label }) => {
              const active = pathname === to || (to === '/expenses' && pathname.startsWith('/expenses'));
              return (
                <Link
                  key={to}
                  to={to}
                  style={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    color: active ? color.accent : color.text2,
                    textDecoration: 'none',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    background: active ? color.accentLight : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleExport}
              disabled={exporting}
              style={{
                padding: '7px 14px',
                background: 'transparent',
                color: color.accent,
                fontWeight: 600,
                fontSize: 13,
                borderRadius: 8,
                border: `1.5px solid ${color.accent}`,
                cursor: exporting ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.6 : 1,
                fontFamily: font,
                transition: 'all 0.15s',
              }}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>

            <Link
              to="/expenses/new"
              style={{
                padding: '7px 16px',
                background: color.accent,
                color: '#fff',
                fontWeight: 600,
                fontSize: 13,
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              + Add Expense
            </Link>

            <button
              onClick={handleLogout}
              style={{
                padding: '7px 14px',
                background: 'transparent',
                color: color.text2,
                fontWeight: 500,
                fontSize: 13,
                borderRadius: 8,
                border: `1.5px solid ${color.border}`,
                cursor: 'pointer',
                fontFamily: font,
                transition: 'all 0.15s',
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {exportErr && (
        <p style={{ fontFamily: font, color: color.danger, fontSize: 13, marginTop: 8, marginBottom: 0 }}>
          {exportErr}
        </p>
      )}
    </div>
  );
}
