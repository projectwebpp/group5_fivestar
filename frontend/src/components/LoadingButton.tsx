export default function LoadingButton({
  loading,
  label,
  onClick,
  type = 'button',
  loadingLabel = 'Saving...',
}: {
  loading: boolean;
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  loadingLabel?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '12px 24px',
        background: loading ? '#7A7064' : 'oklch(48% 0.10 195)',
        color: '#fff',
        fontWeight: 700,
        fontSize: 14,
        border: 'none',
        borderRadius: 12,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
