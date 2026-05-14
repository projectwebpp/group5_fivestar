import { color, font, radius } from '../theme';

export default function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 12,
        padding: '10px 14px',
        background: color.dangerLight,
        border: `1px solid #FECACA`,
        borderRadius: radius.md,
        fontFamily: font,
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>⚠️</span>
      <p style={{ margin: 0, color: color.danger, fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
        {message}
      </p>
    </div>
  );
}
