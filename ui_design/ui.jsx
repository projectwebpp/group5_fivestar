// ui.jsx — reusable UI parts

// ── Outline category icons (minimal, stroke-based) ────────────
const _iconProps = {
  width: '60%', height: '60%', viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.6,
  strokeLinecap: 'round', strokeLinejoin: 'round',
};
const CAT_ICONS = {
  food: (
    <svg {..._iconProps}>
      <path d="M4 11h16" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 4v3" />
    </svg>
  ),
  transport: (
    <svg {..._iconProps}>
      <path d="M5 16V10l2-5h10l2 5v6" />
      <path d="M3 16h18" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  ),
  shopping: (
    <svg {..._iconProps}>
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  bills: (
    <svg {..._iconProps}>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  ),
  entertainment: (
    <svg {..._iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9.5v5l4-2.5-4-2.5z" />
    </svg>
  ),
  health: (
    <svg {..._iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  ),
  education: (
    <svg {..._iconProps}>
      <path d="M3 5h7a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H3V5z" />
      <path d="M21 5h-7a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h7V5z" />
    </svg>
  ),
  other: (
    <svg {..._iconProps}>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  salary: (
    <svg {..._iconProps}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  freelance: (
    <svg {..._iconProps}>
      <rect x="4" y="5" width="16" height="11" rx="1" />
      <path d="M2 19h20" />
    </svg>
  ),
  bonus: (
    <svg {..._iconProps}>
      <rect x="3" y="10" width="18" height="10" rx="1" />
      <path d="M3 10h18" />
      <path d="M12 10v10" />
      <path d="M8 7a2 2 0 0 1 4 0c0 1.5-1 3-1 3s-1-1-3-1a2 2 0 1 1 0-2z" />
      <path d="M16 7a2 2 0 0 0-4 0c0 1.5 1 3 1 3s1-1 3-1a2 2 0 1 0 0-2z" />
    </svg>
  ),
  other_in: (
    <svg {..._iconProps}>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
};

// ── Category chip (rounded square w/ outline icon) ────────────
function CategoryChip({ cat, size = 40, radius }) {
  const c = getCat(cat);
  const r = radius != null ? radius : Math.round(size * 0.32);
  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: c.bg, color: c.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {CAT_ICONS[cat] || CAT_ICONS.other}
    </div>
  );
}

// ── Stat pill (income / expense quick numbers) ────────────────
function StatPill({ label, value, kind, theme }) {
  const accent = kind === 'income' ? theme.income : theme.expense;
  const arrow  = kind === 'income' ? '↓' : '↑';
  return (
    <div style={{
      flex: 1, background: theme.subBg, borderRadius: 16,
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <div style={{
          width: 18, height: 18, borderRadius: 6, flexShrink: 0,
          background: accent + '22', color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, lineHeight: 1,
        }}>{arrow}</div>
        <div style={{ fontSize: 13, color: theme.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: theme.ink, letterSpacing: -0.3 }}>
        ฿{formatTHB(value)}
      </div>
    </div>
  );
}

// ── Balance card ──────────────────────────────────────────────
function BalanceCard({ balance, income, expense, monthLabel, onPrev, onNext, theme }) {
  return (
    <div style={{
      background: theme.cardBg, borderRadius: 24, padding: 22,
      boxShadow: theme.cardShadow,
      border: theme.cardBorder,
    }}>
      {/* month selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, color: theme.muted, fontWeight: 500, letterSpacing: 0.2 }}>
          ยอดคงเหลือสุทธิ
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: theme.subBg, borderRadius: 999, padding: '4px 6px',
        }}>
          <button onClick={onPrev} style={navBtn(theme)} aria-label="เดือนก่อน">‹</button>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink, padding: '0 6px', minWidth: 90, textAlign: 'center' }}>
            {monthLabel}
          </div>
          <button onClick={onNext} style={navBtn(theme)} aria-label="เดือนถัดไป">›</button>
        </div>
      </div>

      {/* hero balance */}
      <div style={{
        fontSize: 44, fontWeight: 800, color: theme.ink,
        lineHeight: 1.05, marginTop: 8, letterSpacing: -1.2,
        fontFeatureSettings: '"tnum" 1',
      }}>
        <span style={{ fontSize: 28, fontWeight: 600, color: theme.muted, marginRight: 4 }}>฿</span>
        {formatTHB(balance)}
      </div>
      <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>
        {balance >= 0 ? 'คุณมีเงินคงเหลือเดือนนี้' : 'รายจ่ายเกินรายรับเดือนนี้'}
      </div>

      {/* stat pills */}
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <StatPill label="รายรับ" value={income} kind="income" theme={theme} />
        <StatPill label="รายจ่าย" value={expense} kind="expense" theme={theme} />
      </div>
    </div>
  );
}

const navBtn = (theme) => ({
  width: 24, height: 24, borderRadius: 999,
  border: 'none', background: 'transparent',
  color: theme.ink, fontSize: 16, lineHeight: 1,
  cursor: 'pointer', padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
});

// ── Category breakdown chart ──────────────────────────────────
function CategoryChart({ txns, theme }) {
  const expenses = txns.filter(t => t.type === 'expense');
  const total = expenses.reduce((s, t) => s + t.amount, 0);

  // group
  const byCat = {};
  for (const t of expenses) {
    byCat[t.cat] = (byCat[t.cat] || 0) + t.amount;
  }
  const rows = Object.entries(byCat)
    .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? amt / total : 0 }))
    .sort((a, b) => b.amt - a.amt);

  return (
    <div style={{
      background: theme.cardBg, borderRadius: 24, padding: 22,
      boxShadow: theme.cardShadow, border: theme.cardBorder,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap' }}>
          แบ่งตามหมวดหมู่
        </div>
        <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap' }}>เดือนนี้</div>
      </div>

      {total === 0 ? (
        <div style={{ fontSize: 14, color: theme.muted, marginTop: 16 }}>ยังไม่มีรายจ่ายเดือนนี้</div>
      ) : (
        <>
          {/* stacked bar */}
          <div style={{
            display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden',
            marginTop: 16, gap: 2, background: theme.subBg,
          }}>
            {rows.map(r => (
              <div key={r.cat} style={{
                flex: r.pct, background: getCat(r.cat).color, minWidth: 2,
              }} />
            ))}
          </div>

          {/* legend list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {rows.slice(0, 5).map(r => {
              const c = getCat(r.cat);
              return (
                <div key={r.cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, fontSize: 15, color: theme.ink, fontWeight: 500 }}>
                    {c.label}
                  </div>
                  <div style={{
                    fontSize: 13, color: theme.muted, fontVariantNumeric: 'tabular-nums',
                    minWidth: 38, textAlign: 'right',
                  }}>
                    {Math.round(r.pct * 100)}%
                  </div>
                  <div style={{
                    fontSize: 15, color: theme.ink, fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                    minWidth: 70, textAlign: 'right',
                  }}>
                    ฿{formatTHB(r.amt)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Transaction row ───────────────────────────────────────────
function TxnRow({ txn, theme, density = 'comfortable', onClick, expanded, onDelete }) {
  const c = getCat(txn.cat);
  const isIncome = txn.type === 'income';
  const sign = isIncome ? '+' : '−';
  const color = isIncome ? theme.income : theme.ink;
  const pad = density === 'compact' ? '10px 4px' : '14px 4px';
  return (
    <div style={{ borderBottom: `1px solid ${theme.divider}` }}>
      <button
        onClick={onClick}
        style={{
          all: 'unset', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: pad, width: '100%', boxSizing: 'border-box',
        }}
      >
        <CategoryChip cat={txn.cat} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, color: theme.ink, fontWeight: 600,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {txn.note || c.label}
            {txn.slip && (
              <span title="มีสลิปแนบ" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 16, height: 16, borderRadius: 4,
                background: theme.subBg, color: theme.muted, fontSize: 10, flexShrink: 0,
              }}>📎</span>
            )}
          </div>
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>
            {c.label} · {formatDate(txn.date)}
          </div>
        </div>
        <div style={{
          fontSize: 17, fontWeight: 700, color,
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
        }}>
          {sign}฿{formatTHB(txn.amount)}
        </div>
        <div style={{
          color: theme.muted, fontSize: 14, transition: 'transform 200ms',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0)',
        }}>›</div>
      </button>
      {expanded && (
        <div style={{
          padding: '4px 4px 14px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {txn.slip && (
            <a href={txn.slip.dataUrl} target="_blank" rel="noopener" style={{
              display: 'block', borderRadius: 12, overflow: 'hidden',
              border: `1px solid ${theme.divider}`, background: theme.subBg,
            }}>
              <img src={txn.slip.dataUrl} alt="สลิป" style={{
                display: 'block', width: '100%', maxHeight: 280, objectFit: 'contain',
              }} />
            </a>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm('ลบรายการนี้ใช่ไหม?')) onDelete && onDelete(txn.id); }}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '9px 16px', borderRadius: 10,
                background: theme.expense + '14', color: theme.expense,
                fontSize: 14, fontWeight: 600,
              }}
            >ลบรายการ</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ title, action, theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 4px', marginBottom: 6, gap: 12,
    }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap' }}>{title}</div>
      {action}
    </div>
  );
}

Object.assign(window, {
  CategoryChip, StatPill, BalanceCard, CategoryChart, TxnRow, SectionHeader,
});
