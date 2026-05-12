// stats-screen.jsx — Dashboard with charts for spending history

function StatsScreen({ txns, theme, isDesktop, monthIdx }) {
  // Filter to this month
  const monthTxns = txns.filter(t => new Date(t.date + 'T00:00:00').getMonth() === monthIdx);
  const income  = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const daysInMonth = new Date(2026, monthIdx + 1, 0).getDate();
  const dailyAvg = expense / daysInMonth;
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;

  const card = {
    background: theme.cardBg, borderRadius: 20, padding: 22,
    border: theme.cardBorder, boxShadow: theme.cardShadow,
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: isDesktop ? 28 : 22, fontWeight: 700, color: theme.ink,
          letterSpacing: -0.4,
        }}>สถิติการใช้จ่าย</div>
        <div style={{ fontSize: 14, color: theme.muted, marginTop: 4 }}>
          {TH_MONTHS_FULL[monthIdx]} 2569 · ภาพรวม{daysInMonth} วัน
        </div>
      </div>

      {/* KPI cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
        gap: 12, marginBottom: 20,
      }}>
        <KpiCard label="รายรับ"    value={'฿' + formatTHB(income)}  tone={theme.income} sub="เดือนนี้" theme={theme} />
        <KpiCard label="รายจ่าย"   value={'฿' + formatTHB(expense)} tone={theme.expense} sub="เดือนนี้" theme={theme} />
        <KpiCard label="คงเหลือ"   value={'฿' + formatTHB(balance)} tone={theme.ink} sub={`อัตราออม ${savingsRate}%`} theme={theme} />
        <KpiCard label="เฉลี่ย/วัน" value={'฿' + formatTHB(dailyAvg)} tone={theme.ink} sub="รายจ่าย" theme={theme} />
      </div>

      {/* main grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1.4fr 1fr' : '1fr',
        gap: 16, alignItems: 'start',
      }}>
        <div style={{ ...card }}>
          <ChartHeader title="รายจ่ายรายวัน" sub={`${TH_MONTHS_SHORT[monthIdx]} 2569`} theme={theme} />
          <DailyBars txns={monthTxns} monthIdx={monthIdx} theme={theme} />
        </div>
        <div style={{ ...card }}>
          <ChartHeader title="แบ่งตามหมวดหมู่" sub="รายจ่าย" theme={theme} />
          <DonutChart txns={monthTxns} theme={theme} />
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1.4fr 1fr' : '1fr',
        gap: 16, alignItems: 'start',
      }}>
        <div style={{ ...card }}>
          <ChartHeader title="แนวโน้ม 5 เดือน" sub="รายรับ vs รายจ่าย" theme={theme} />
          <MonthlyTrend txns={txns} currentMonth={monthIdx} theme={theme} />
        </div>
        <div style={{ ...card }}>
          <ChartHeader title="หมวดที่ใช้มากสุด" sub="เดือนนี้" theme={theme} />
          <TopCategories txns={monthTxns} theme={theme} />
        </div>
      </div>
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────
function KpiCard({ label, value, tone, sub, theme }) {
  return (
    <div style={{
      background: theme.cardBg, borderRadius: 16, padding: '16px 18px',
      border: theme.cardBorder, boxShadow: theme.cardShadow,
    }}>
      <div style={{ fontSize: 13, color: theme.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: tone,
        marginTop: 4, letterSpacing: -0.4,
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: theme.muted, marginTop: 4, whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  );
}

function ChartHeader({ title, sub, theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 16, gap: 12,
    }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap' }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>
  );
}

// ── Daily bar chart ───────────────────────────────────────────
function DailyBars({ txns, monthIdx, theme }) {
  const days = new Date(2026, monthIdx + 1, 0).getDate();
  const buckets = new Array(days).fill(0);
  for (const t of txns) {
    if (t.type !== 'expense') continue;
    const d = new Date(t.date + 'T00:00:00').getDate();
    buckets[d - 1] += t.amount;
  }
  const max = Math.max(...buckets, 1);

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 3,
        height: 160, padding: '4px 0',
      }}>
        {buckets.map((v, i) => {
          const h = Math.max((v / max) * 100, v > 0 ? 4 : 0);
          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end', alignItems: 'stretch',
              height: '100%', minWidth: 0,
            }}>
              <div title={`${i+1} ${TH_MONTHS_SHORT[monthIdx]} · ฿${formatTHB(v)}`}
                style={{
                  height: `${h}%`,
                  background: v > 0 ? theme.accent : 'transparent',
                  borderRadius: 3,
                  opacity: v > 0 ? 0.85 : 0,
                  transition: 'all 200ms ease',
                }} />
            </div>
          );
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: theme.muted, marginTop: 8,
      }}>
        <span>1</span>
        <span>{Math.ceil(days / 2)}</span>
        <span>{days}</span>
      </div>
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────
function DonutChart({ txns, theme }) {
  const expenses = txns.filter(t => t.type === 'expense');
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const byCat = {};
  for (const t of expenses) byCat[t.cat] = (byCat[t.cat] || 0) + t.amount;
  const slices = Object.entries(byCat)
    .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? amt / total : 0 }))
    .sort((a, b) => b.amt - a.amt);

  const r = 64, c = 80, stroke = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={c * 2} height={c * 2} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke={theme.subBg} strokeWidth={stroke} />
          {slices.map(s => {
            const len = s.pct * circ;
            const el = (
              <circle key={s.cat}
                cx={c} cy={c} r={r} fill="none"
                stroke={getCat(s.cat).color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: theme.muted }}>รวม</div>
          <div style={{
            fontSize: 18, fontWeight: 700, color: theme.ink,
            fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3,
          }}>฿{formatTHB(total)}</div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.length === 0 && (
          <div style={{ fontSize: 13, color: theme.muted }}>ยังไม่มีข้อมูล</div>
        )}
        {slices.slice(0, 5).map(s => {
          const ct = getCat(s.cat);
          return (
            <div key={s.cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: ct.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, color: theme.ink, whiteSpace: 'nowrap' }}>{ct.label}</div>
              <div style={{
                fontSize: 13, color: theme.muted, fontVariantNumeric: 'tabular-nums',
              }}>{Math.round(s.pct * 100)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Monthly trend ─────────────────────────────────────────────
function MonthlyTrend({ txns, currentMonth, theme }) {
  // last 5 months ending at currentMonth
  const months = [];
  for (let i = 4; i >= 0; i--) {
    const m = currentMonth - i;
    if (m < 0) continue;
    months.push(m);
  }
  const data = months.map(m => {
    const ms = txns.filter(t => new Date(t.date + 'T00:00:00').getMonth() === m);
    return {
      m,
      income:  ms.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: ms.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    };
  });
  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

  return (
    <div>
      <div style={{
        display: 'flex', gap: 6, marginBottom: 12, fontSize: 12, color: theme.muted,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: theme.income }} /> รายรับ
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: theme.expense }} /> รายจ่าย
        </span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 14,
        height: 160,
      }}>
        {data.map(d => (
          <div key={d.m} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            minWidth: 0, height: '100%',
          }}>
            <div style={{
              flex: 1, width: '100%',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4,
            }}>
              <div title={`รายรับ ฿${formatTHB(d.income)}`} style={{
                width: 14, height: `${(d.income / max) * 100}%`,
                background: theme.income, borderRadius: 4, opacity: 0.85,
                minHeight: d.income > 0 ? 3 : 0,
              }} />
              <div title={`รายจ่าย ฿${formatTHB(d.expense)}`} style={{
                width: 14, height: `${(d.expense / max) * 100}%`,
                background: theme.expense, borderRadius: 4, opacity: 0.85,
                minHeight: d.expense > 0 ? 3 : 0,
              }} />
            </div>
            <div style={{
              fontSize: 11, color: d.m === currentMonth ? theme.ink : theme.muted,
              fontWeight: d.m === currentMonth ? 600 : 500, whiteSpace: 'nowrap',
            }}>{TH_MONTHS_SHORT[d.m]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top categories list ───────────────────────────────────────
function TopCategories({ txns, theme }) {
  const expenses = txns.filter(t => t.type === 'expense');
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  const byCat = {};
  for (const t of expenses) byCat[t.cat] = (byCat[t.cat] || 0) + t.amount;
  const rows = Object.entries(byCat)
    .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? amt / total : 0 }))
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.length === 0 && (
        <div style={{ fontSize: 13, color: theme.muted }}>ยังไม่มีข้อมูล</div>
      )}
      {rows.map((r, i) => {
        const c = getCat(r.cat);
        return (
          <div key={r.cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CategoryChip cat={r.cat} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: 4, gap: 8,
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap' }}>{c.label}</div>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: theme.ink,
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                }}>฿{formatTHB(r.amt)}</div>
              </div>
              <div style={{
                height: 6, borderRadius: 999, background: theme.subBg, overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.max(r.pct * 100, 2)}%`, height: '100%',
                  background: c.color, borderRadius: 999,
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { StatsScreen });
