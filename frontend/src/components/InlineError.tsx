export default function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p style={{ color: '#C0392B', fontSize: 14, fontWeight: 400, marginTop: 12 }}>
      {message}
    </p>
  );
}
