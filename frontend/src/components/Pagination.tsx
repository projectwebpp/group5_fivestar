interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export default function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  const buttonBase: React.CSSProperties = {
    background: '#EDE7DA',
    color: '#1F1B16',
    fontWeight: 700,
    padding: '0 16px',
    borderRadius: 12,
    border: 'none',
    minHeight: 48,
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
      }}
    >
      <button
        onClick={onPrev}
        disabled={isPrevDisabled}
        style={{
          ...buttonBase,
          opacity: isPrevDisabled ? 0.4 : 1,
          cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        &#8592; Prev
      </button>

      <span style={{ fontSize: 13, color: '#7A7064', fontWeight: 400 }}>
        Page {page} of {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={isNextDisabled}
        style={{
          ...buttonBase,
          opacity: isNextDisabled ? 0.4 : 1,
          cursor: isNextDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        Next &#8594;
      </button>
    </div>
  );
}
