import { color } from '../theme';

export default function Spinner({ fullPage = false }: { fullPage?: boolean }) {
  const circle = (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: `3px solid ${color.surfaceAlt}`,
        borderTopColor: color.accent,
        animation: '_spin 0.7s linear infinite',
      }}
    />
  );

  if (fullPage) {
    return (
      <div style={{ minHeight: '100vh', background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {circle}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
      {circle}
    </div>
  );
}
