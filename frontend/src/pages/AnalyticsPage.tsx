import { useEffect, useState } from "react";
import Spinner from "../components/Spinner";
import { color } from "../theme";
import { getAnalyticsSummary } from "../api/analytics";
import type { AnalyticsSummary, CategoryBreakdown } from "../types/analytics";

const TH_MONTHS_FULL  = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

const CAT_COLORS = [
  'oklch(62% 0.14 35)', 'oklch(58% 0.13 230)', 'oklch(60% 0.14 330)',
  'oklch(58% 0.11 95)', 'oklch(60% 0.12 165)', 'oklch(60% 0.15 12)',
  'oklch(55% 0.13 275)', 'oklch(55% 0.03 80)',
];

function formatTHB(n: number) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(n));
}

function toISO(d: Date) { return d.toISOString().split('T')[0]; }

function getPresetDates(preset: string): { from: string; to: string } {
  const now = new Date();
  if (preset === 'last-month') {
    return {
      from: toISO(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: toISO(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  if (preset === 'last-3') {
    return {
      from: toISO(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
      to: toISO(now),
    };
  }
  return {
    from: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: toISO(now),
  };
}

function useIsDesktop() {
  const [v, setV] = useState(() => window.innerWidth >= 960);
  useEffect(() => {
    const h = () => setV(window.innerWidth >= 960);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return v;
}

function KpiCard({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div style={{
      background: color.surface, borderRadius: 16, padding: '16px 18px',
      border: `1px solid ${color.border}`,
      boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
    }}>
      <div style={{ fontSize: 13, color: color.text2, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{
        fontSize: 22, fontWeight: 700, color: tone ?? color.text1,
        marginTop: 4, letterSpacing: -0.4,
        fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: color.text2, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ChartHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: color.text1 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, color: color.text2 }}>{sub}</div>}
    </div>
  );
}

function DonutChart({ breakdown }: { breakdown: CategoryBreakdown[] }) {
  const total = breakdown.reduce((s, c) => s + c.total, 0);
  const r = 64, c = 80, stroke = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={c * 2} height={c * 2} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={c} cy={c} r={r} fill="none" stroke={color.surfaceAlt} strokeWidth={stroke} />
          {breakdown.map((s, i) => {
            const pct = total > 0 ? s.total / total : 0;
            const len = pct * circ;
            const el = (
              <circle key={s.name}
                cx={c} cy={c} r={r} fill="none"
                stroke={CAT_COLORS[i % CAT_COLORS.length]}
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
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: color.text2 }}>รวม</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: color.text1, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.3 }}>
            ฿{formatTHB(total)}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {breakdown.length === 0 && <div style={{ fontSize: 13, color: color.text2 }}>ยังไม่มีข้อมูล</div>}
        {breakdown.slice(0, 5).map((s, i) => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: CAT_COLORS[i % CAT_COLORS.length], flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: color.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
            <div style={{ fontSize: 13, color: color.text2, fontVariantNumeric: 'tabular-nums' }}>{Math.round(s.percentage)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopCategories({ breakdown }: { breakdown: CategoryBreakdown[] }) {
  const total = breakdown.reduce((s, c) => s + c.total, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {breakdown.length === 0 && <div style={{ fontSize: 13, color: color.text2 }}>ยังไม่มีข้อมูล</div>}
      {breakdown.slice(0, 5).map((r, i) => (
        <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: Math.round(36 * 0.32),
            background: CAT_COLORS[i % CAT_COLORS.length] + '22',
            color: CAT_COLORS[i % CAT_COLORS.length],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, flexShrink: 0,
          }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: color.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: color.text1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                ฿{formatTHB(r.total)}
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: color.surfaceAlt, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max((total > 0 ? r.total / total : 0) * 100, 2)}%`, height: '100%',
                background: CAT_COLORS[i % CAT_COLORS.length], borderRadius: 999,
              }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const PRESETS = [
  { id: 'this-month', label: 'เดือนนี้' },
  { id: 'last-month', label: 'เดือนที่แล้ว' },
  { id: 'last-3',     label: '3 เดือน' },
];

export default function AnalyticsPage() {
  const isDesktop = useIsDesktop();
  const now = new Date();
  const monthLabel = `${TH_MONTHS_FULL[now.getMonth()]} ${now.getFullYear() + 543}`;

  const [preset, setPreset] = useState('this-month');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = (p: string) => {
    const { from, to } = getPresetDates(p);
    setLoading(true);
    setError(null);
    getAnalyticsSummary(from, to)
      .then(d => setData(d))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData('this-month'); }, []);

  const handlePreset = (p: string) => { setPreset(p); fetchData(p); };

  const card = {
    background: color.surface, borderRadius: 20, padding: 22,
    border: `1px solid ${color.border}`,
    boxShadow: '0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: isDesktop ? 28 : 22, fontWeight: 700, color: color.text1, letterSpacing: -0.4 }}>
          สถิติการใช้จ่าย
        </div>
        <div style={{ fontSize: 14, color: color.text2, marginTop: 4 }}>{monthLabel}</div>
      </div>

      {/* Preset tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: color.surfaceAlt, borderRadius: 14, padding: 4, alignSelf: 'flex-start',
        width: 'fit-content',
      }}>
        {PRESETS.map(p => (
          <button key={p.id} onClick={() => handlePreset(p.id)}
            style={{
              all: 'unset', cursor: 'pointer',
              padding: '9px 16px', borderRadius: 10,
              background: preset === p.id ? color.surface : 'transparent',
              color: preset === p.id ? color.text1 : color.text2,
              fontSize: 13, fontWeight: preset === p.id ? 600 : 500,
              whiteSpace: 'nowrap',
              boxShadow: preset === p.id ? '0 1px 2px rgba(31,27,22,0.04)' : 'none',
              transition: 'all 160ms ease',
            }}
          >{p.label}</button>
        ))}
      </div>

      {loading && <Spinner />}
      {error && <p style={{ color: color.danger, fontSize: 14 }}>{error}</p>}

      {!loading && data && (
        <>
          {/* KPI cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: 12, marginBottom: 20,
          }}>
            <KpiCard label="รายจ่ายรวม" value={'฿' + formatTHB(data.total)} sub="ช่วงที่เลือก" tone={color.expense} />
            <KpiCard label="เฉลี่ย/วัน" value={'฿' + formatTHB(data.daily_avg)} sub="รายจ่าย" />
            <KpiCard label="เฉลี่ย/เดือน" value={'฿' + formatTHB(data.monthly_avg)} sub="ประมาณการ" />
          </div>

          {data.category_breakdown.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: color.text2 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: color.text1, marginBottom: 8 }}>ยังไม่มีข้อมูล</div>
              <div style={{ fontSize: 14 }}>ลองเลือกช่วงเวลาอื่น หรือเพิ่มรายการก่อน</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.4fr 1fr' : '1fr', gap: 16, alignItems: 'start' }}>
              <div style={{ ...card }}>
                <ChartHeader title="แบ่งตามหมวดหมู่" sub="รายจ่าย" />
                <DonutChart breakdown={data.category_breakdown} />
              </div>
              <div style={{ ...card }}>
                <ChartHeader title="หมวดที่ใช้มากสุด" />
                <TopCategories breakdown={data.category_breakdown} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
