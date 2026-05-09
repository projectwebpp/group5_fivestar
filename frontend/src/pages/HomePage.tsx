import { useEffect, useState } from 'react';
import apiClient from '../api/client';

interface HealthData {
  status: string;
}

interface HealthResponse {
  success: boolean;
  data: HealthData;
  message: string;
}

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<HealthResponse>('/health')
      .then((res) => {
        setApiStatus(res.data.data.status);
      })
      .catch(() => {
        setError('API unreachable — check VITE_API_URL');
        setApiStatus('error');
      });
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Expense Tracker</h1>
      <p>
        API Status:{' '}
        <strong style={{ color: apiStatus === 'ok' ? 'green' : 'red' }}>
          {apiStatus}
        </strong>
      </p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <nav>
        <ul>
          <li><a href="/auth">Auth (Phase 2)</a></li>
          <li><a href="/expenses">Expenses (Phase 4)</a></li>
          <li><a href="/categories">Categories (Phase 3)</a></li>
          <li><a href="/analytics">Analytics (Phase 5)</a></li>
        </ul>
      </nav>
    </div>
  );
}
