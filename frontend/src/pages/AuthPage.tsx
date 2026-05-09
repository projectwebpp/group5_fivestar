import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

type Tab = 'login' | 'register';

interface AuthSuccess {
  success: true;
  data: { token: string };
  message: string;
}

interface AxiosErrorShape {
  response?: { data?: { message?: string } };
}

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login'); // D-02: login default
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // D-11
  const [loading, setLoading] = useState(false); // D-09
  const [error, setError] = useState<string | null>(null); // D-08
  const navigate = useNavigate();

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/register';
      const body =
        tab === 'login'
          ? { email, password }
          : { email, password, password_confirmation: confirmPassword }; // Pitfall 2
      const res = await apiClient.post<AuthSuccess>(endpoint, body);
      const token = res.data?.data?.token;
      if (!token) {
        setError('Authentication failed: no token returned');
        return;
      }
      localStorage.setItem('auth_token', token); // D-06
      navigate('/'); // D-03
    } catch (err) {
      const msg =
        (err as AxiosErrorShape)?.response?.data?.message ?? 'Something went wrong';
      setError(msg); // D-08
    } finally {
      setLoading(false);
    }
  };

  const tabButtonStyle = (active: boolean): CSSProperties => ({
    fontWeight: active ? 'bold' : 'normal',
    padding: '0.5rem 1rem',
    marginRight: '0.5rem',
    cursor: 'pointer',
  });

  const submitLabel = loading
    ? 'Loading...'
    : tab === 'login'
      ? 'Log In'
      : 'Register';

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '420px' }}>
      <h1>Expense Tracker</h1>

      <div style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => switchTab('login')}
          style={tabButtonStyle(tab === 'login')}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => switchTab('register')}
          style={tabButtonStyle(tab === 'register')}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label>
            Email
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label>
            Password
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={tab === 'register' ? 8 : undefined}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </label>
        </div>

        {tab === 'register' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label>
              Confirm Password
              <br />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                style={{ width: '100%', padding: '0.5rem' }}
              />
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.5rem 1rem', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {submitLabel}
        </button>

        {error && (
          <p style={{ color: 'red', marginTop: '0.75rem' }} role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
