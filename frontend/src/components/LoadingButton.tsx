import { color, font, radius } from '../theme';

export default function LoadingButton({
  loading,
  label,
  onClick,
  type = 'button',
  loadingLabel = 'Saving…',
  fullWidth = false,
  variant = 'primary',
}: {
  loading: boolean;
  label: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  loadingLabel?: string;
  fullWidth?: boolean;
  variant?: 'primary' | 'danger';
}) {
  const bg = variant === 'danger' ? color.danger : color.accent;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : undefined,
        padding: '11px 24px',
        background: loading ? color.surfaceAlt : bg,
        color: loading ? color.text3 : '#fff',
        fontWeight: 600,
        fontSize: 14,
        fontFamily: font,
        border: 'none',
        borderRadius: radius.md,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, opacity 0.15s',
        letterSpacing: '0.01em',
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
      {loading ? loadingLabel : label}
    </button>
  );
}
