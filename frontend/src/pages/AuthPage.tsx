import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import { color, font, radius, shadow } from '../theme';

type Mode = 'login' | 'register';

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: color.text2, marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          display: 'block',
          width: '100%',
          fontSize: 14,
          padding: '10px 14px',
          background: color.surface,
          border: `1.5px solid ${focused ? color.accent : color.border}`,
          borderRadius: radius.md,
          outline: focused ? `3px solid ${color.accentLight}` : 'none',
          outlineOffset: 0,
          color: color.text1,
          fontFamily: font,
          transition: 'border-color 0.15s, outline 0.15s',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (mode === 'register' && password !== confirm) return 'Passwords do not match.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setLoading(true);
    try {
      const token = mode === 'login'
        ? await login(email, password)
        : await register(email, password, confirm);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_email', email);
      navigate('/expenses');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: Array<{ message: string }>; message?: string } } };
      setError(
        e?.response?.data?.errors?.[0]?.message ??
        e?.response?.data?.message ??
        'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, #F4EFE6 0%, #EDE7DA 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: font,
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>💰</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: color.text1, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Expense Tracker
          </h1>
          <p style={{ fontSize: 14, color: color.text2, margin: 0 }}>
            {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create an account to get started.'}
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: color.surface,
            borderRadius: radius.xl,
            padding: 32,
            boxShadow: shadow.lg,
            border: `1px solid ${color.border}`,
          }}
        >
          {/* Tab switcher */}
          <div
            style={{
              display: 'flex',
              background: color.surfaceAlt,
              borderRadius: radius.lg,
              padding: 4,
              marginBottom: 28,
            }}
          >
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setConfirm(''); }}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  border: 'none',
                  borderRadius: radius.md,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: font,
                  background: mode === m ? color.surface : 'transparent',
                  color: mode === m ? color.text1 : color.text3,
                  boxShadow: mode === m ? shadow.sm : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {m === 'login' ? 'Log In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <Field label="Email" type="email" value={email} onChange={setEmail}
              placeholder="you@example.com" autoComplete="email" />
            <Field label="Password" type="password" value={password} onChange={setPassword}
              placeholder="Min. 8 characters"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            {mode === 'register' && (
              <Field label="Confirm Password" type="password" value={confirm} onChange={setConfirm}
                placeholder="Re-enter password" autoComplete="new-password" />
            )}

            {error && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  padding: '10px 14px',
                  background: color.dangerLight,
                  border: `1px solid #FECACA`,
                  borderRadius: radius.md,
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 13 }}>⚠️</span>
                <p style={{ margin: 0, color: color.danger, fontSize: 13, fontWeight: 500 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '12px 0',
                background: loading ? color.surfaceAlt : color.accent,
                color: loading ? color.text3 : '#fff',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: font,
                border: 'none',
                borderRadius: radius.md,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                letterSpacing: '0.01em',
                marginTop: error ? 0 : 4,
              }}
            >
              {loading && (
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: `2px solid ${color.text3}`,
                    borderTopColor: 'transparent',
                    animation: '_spin 0.7s linear infinite',
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
              )}
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Log In' : 'Create Account')}
            </button>
          </form>
        </div>

        {/* Switch link */}
        <p style={{ textAlign: 'center', color: color.text2, fontSize: 13, marginTop: 20 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null); setConfirm(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: color.accent,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: font,
              padding: 0,
            }}
          >
            {mode === 'login' ? 'Register' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}
