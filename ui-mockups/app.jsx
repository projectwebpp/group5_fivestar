// app.jsx — responsive web app: Home + Add screens, sidebar (desktop), tab bar (mobile)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "cream",
  "accent": "teal",
  "density": "comfortable"
}/*EDITMODE-END*/;

const ACCENTS = {
  teal:    'oklch(48% 0.10 195)',
  indigo:  'oklch(45% 0.15 270)',
  rust:    'oklch(52% 0.13 35)',
  forest:  'oklch(45% 0.10 150)',
};

function makeTheme({ theme, accent }) {
  const a = ACCENTS[accent] || ACCENTS.teal;
  if (theme === 'dark') {
    return {
      mode: 'dark',
      bg:'#16140F', cardBg:'#221F19', subBg:'#2C2920',
      ink:'#F4EFE6', muted:'#A39C8E',
      divider:'rgba(255,255,255,0.08)',
      cardBorder:'1px solid rgba(255,255,255,0.05)',
      cardShadow:'none',
      income:'oklch(72% 0.16 155)', expense:'oklch(70% 0.16 25)',
      accent: a.replace('48%','70%').replace('45%','65%').replace('52%','70%'),
    };
  }
  if (theme === 'pure') {
    return {
      mode: 'light',
      bg:'#FFFFFF', cardBg:'#FFFFFF', subBg:'#F4F4F2',
      ink:'#16140F', muted:'#7A7468',
      divider:'rgba(0,0,0,0.06)',
      cardBorder:'1px solid rgba(0,0,0,0.05)',
      cardShadow:'0 1px 2px rgba(0,0,0,0.03)',
      income:'oklch(50% 0.14 155)', expense:'oklch(54% 0.16 25)',
      accent: a,
    };
  }
  return {
    mode: 'light',
    bg:'#F4EFE6', cardBg:'#FFFCF7', subBg:'#EDE7DA',
    ink:'#1F1B16', muted:'#7A7064',
    divider:'rgba(31,27,22,0.07)',
    cardBorder:'1px solid rgba(31,27,22,0.04)',
    cardShadow:'0 1px 2px rgba(31,27,22,0.04), 0 8px 24px rgba(31,27,22,0.04)',
    income:'oklch(50% 0.14 155)', expense:'oklch(54% 0.16 25)',
    accent: a,
  };
}

// ── Hooks ─────────────────────────────────────────────────────
function useViewport() {
  const [w, setW] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  React.useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { width: w, isDesktop: w >= 960 };
}

// ── Sidebar (desktop) ─────────────────────────────────────────
function Sidebar({ screen, onScreen, theme }) {
  const items = [
    { id: 'home',    label: 'หน้าหลัก',    glyph: '◉' },
    { id: 'add',     label: 'เพิ่มรายการ', glyph: '+' },
    { id: 'history', label: 'ประวัติ',     glyph: '☰' },
    { id: 'stats',   label: 'สถิติ',       glyph: '▤' },
  ];
  return (
    <aside style={{
      borderRight: `1px solid ${theme.divider}`,
      background: theme.cardBg,
      padding: '28px 18px 24px',
      display: 'flex', flexDirection: 'column', gap: 6,
      position: 'sticky', top: 0, height: '100vh',
      boxSizing: 'border-box',
    }}>
      <div style={{
        fontSize: 22, fontWeight: 800, color: theme.ink,
        letterSpacing: -0.5, padding: '0 12px 24px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: theme.accent,
          color: '#FFFCF7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700,
        }}>฿</div>
        <span style={{ whiteSpace: 'nowrap' }}>Expense <span style={{ color: theme.accent }}>Tracker</span></span>
      </div>
      {items.map(it => {
        const active = screen === it.id;
        return (
          <button
            key={it.id} onClick={() => onScreen(it.id)}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px', borderRadius: 12,
              background: active ? theme.subBg : 'transparent',
              color: active ? theme.ink : theme.muted,
              fontSize: 15, fontWeight: active ? 600 : 500,
              transition: 'all 160ms ease',
            }}
          >
            <span style={{ width: 18, fontSize: 16, textAlign: 'center', color: active ? theme.accent : theme.muted }}>{it.glyph}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{it.label}</span>
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button
        onClick={() => onScreen('me')}
        style={{
          all: 'unset', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: 12, borderRadius: 14,
          background: theme.subBg,
          border: `1.5px solid ${screen === 'me' ? theme.accent : 'transparent'}`,
          transition: 'all 160ms ease',
          boxSizing: 'border-box',
        }}
        aria-label="บัญชีของฉัน"
      >
        <div style={{
          width: 36, height: 36, borderRadius: 999,
          background: theme.cardBg, color: theme.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>นภ</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>คุณนภัส</div>
          <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>napas@example.com</div>
        </div>
      </button>
    </aside>
  );
}

// ── Mobile tab bar ────────────────────────────────────────────
function MobileTabBar({ screen, onScreen, theme }) {
  const tabs = [
    { id: 'home',    label: 'หน้าหลัก', glyph: '◉' },
    { id: 'history', label: 'ประวัติ',   glyph: '☰' },
    { id: 'add',     label: '',          glyph: '+', primary: true },
    { id: 'stats',   label: 'สถิติ',     glyph: '▤' },
    { id: 'me',      label: 'ฉัน',       glyph: '○' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
      paddingTop: 8,
      background: theme.bg + 'EE',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: `1px solid ${theme.divider}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      zIndex: 30,
    }}>
      {tabs.map(t => {
        if (t.primary) {
          return (
            <button
              key={t.id} onClick={() => onScreen('add')}
              aria-label="เพิ่มรายการ"
              style={{
                all: 'unset', cursor: 'pointer',
                width: 52, height: 52, borderRadius: 18,
                background: theme.accent, color: '#FFFCF7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 400, lineHeight: 1, marginTop: -16,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12)',
              }}
            >+</button>
          );
        }
        const isActive = screen === t.id;
        return (
          <button
            key={t.id} onClick={() => onScreen(t.id)}
            style={{
              all: 'unset', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 12px',
            }}
          >
            <div style={{ fontSize: 18, color: isActive ? theme.ink : theme.muted, lineHeight: 1 }}>{t.glyph}</div>
            <div style={{
              fontSize: 11, color: isActive ? theme.ink : theme.muted,
              fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap',
            }}>{t.label}</div>
          </button>
        );
      })}
    </div>
  );
}

// ── Header (greeting / page title) ────────────────────────────
function PageHeader({ theme, isDesktop, monthIdx, onMonth, onAdd }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, marginBottom: 20, flexWrap: 'wrap',
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, color: theme.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>สวัสดี,</div>
        <div style={{
          fontSize: isDesktop ? 28 : 22, fontWeight: 700, color: theme.ink,
          marginTop: 2, letterSpacing: -0.4, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>คุณนภัส</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {isDesktop && (
          <button onClick={onAdd} style={{
            all: 'unset', cursor: 'pointer',
            padding: '10px 18px', borderRadius: 12,
            background: theme.accent, color: '#FFFCF7',
            fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}>+ เพิ่มรายการ</button>
        )}
      </div>
    </div>
  );
}
const navBtn = (theme) => ({
  all: 'unset', cursor: 'pointer',
  width: 26, height: 26, borderRadius: 999,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: theme.ink, fontSize: 16, lineHeight: 1,
});

// ── Home screen ───────────────────────────────────────────────
function HomeScreen({ txns, monthIdx, onMonthChange, theme, density, isDesktop, onAdd, onDelete }) {
  const monthTxns = txns.filter(t => new Date(t.date + 'T00:00:00').getMonth() === monthIdx);
  const income  = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const recent = [...monthTxns].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const [expandedId, setExpandedId] = React.useState(null);

  // group by date
  const groups = [];
  let last = null;
  for (const t of recent) {
    if (t.date !== last) { groups.push({ date: t.date, items: [t] }); last = t.date; }
    else groups[groups.length - 1].items.push(t);
  }

  const monthLabel = `${TH_MONTHS_SHORT[monthIdx]} 2569`;

  // For desktop: a 2-column grid; for mobile: stacked
  return (
    <div>
      <PageHeader theme={theme} isDesktop={isDesktop} monthIdx={monthIdx} onMonth={onMonthChange} onAdd={onAdd} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
        gap: isDesktop ? 20 : 16,
        alignItems: 'start',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? 20 : 16 }}>
          <BalanceCard
            balance={balance} income={income} expense={expense}
            monthLabel={monthLabel}
            onPrev={() => onMonthChange(Math.max(0, monthIdx - 1))}
            onNext={() => onMonthChange(Math.min(11, monthIdx + 1))}
            theme={theme}
          />
          <CategoryChart txns={monthTxns} theme={theme} />
        </div>
        <div style={isDesktop ? {
          maxHeight: 'calc(100vh - 140px)',
          overflowY: 'auto',
          paddingRight: 4,
        } : {}}>
          <SectionHeader title="รายการล่าสุด" theme={theme}
            action={<div style={{ fontSize: 13, color: theme.accent, fontWeight: 600 }}>ดูทั้งหมด</div>} />
          {groups.length === 0 ? (
            <div style={{
              background: theme.cardBg, borderRadius: 20, padding: 24,
              textAlign: 'center', color: theme.muted, fontSize: 14,
              border: theme.cardBorder,
            }}>ยังไม่มีรายการเดือนนี้</div>
          ) : groups.map(g => (
            <div key={g.date} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 12, color: theme.muted, fontWeight: 600,
                letterSpacing: 0.4, padding: '8px 4px 6px',
              }}>{formatDayLong(g.date)}</div>
              <div style={{
                background: theme.cardBg, borderRadius: 20, padding: '0 14px',
                border: theme.cardBorder, boxShadow: theme.cardShadow,
              }}>
                {g.items.map((t, i) => (
                  <TxnRow
                    key={t.id} txn={t}
                    theme={{ ...theme, divider: i === g.items.length - 1 ? 'transparent' : theme.divider }}
                    density={density}
                    expanded={expandedId === t.id}
                    onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    onDelete={(id) => { setExpandedId(null); onDelete(id); }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stub screen (history / stats / me) ───────────────────────
function StubScreen({ title, theme }) {
  return (
    <div style={{ paddingTop: 80, textAlign: 'center', color: theme.muted }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: theme.ink, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14 }}>ยังไม่ได้ใช้งานในต้นแบบนี้</div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = React.useMemo(() => makeTheme({ theme: tweaks.theme, accent: tweaks.accent }), [tweaks.theme, tweaks.accent]);
  const { isDesktop } = useViewport();

  const [txns, setTxns] = React.useState(SAMPLE_TXNS);
  const [monthIdx, setMonthIdx] = React.useState(4);
  const [screen, setScreen] = React.useState('home');
  const [toast, setToast] = React.useState(null);

  const handleSave = (txn) => {
    setTxns(prev => [txn, ...prev]);
    setScreen('home');
    const d = new Date(txn.date + 'T00:00:00');
    setMonthIdx(d.getMonth());
    setToast(`บันทึก${txn.type === 'income' ? 'รายรับ' : 'รายจ่าย'} ฿${formatTHB(txn.amount)} แล้ว`);
    setTimeout(() => setToast(null), 2400);
  };

  const handleDelete = (id) => {
    const removed = txns.find(t => t.id === id);
    setTxns(prev => prev.filter(t => t.id !== id));
    if (removed) {
      setToast(`ลบ${removed.type === 'income' ? 'รายรับ' : 'รายจ่าย'} ฿${formatTHB(removed.amount)} แล้ว`);
      setTimeout(() => setToast(null), 2400);
    }
  };

  let content;
  if (screen === 'add') {
    content = <AddScreen onSave={handleSave} onCancel={() => setScreen('home')} theme={theme} isDesktop={isDesktop} />;
  } else if (screen === 'home') {
    content = <HomeScreen
      txns={txns} monthIdx={monthIdx} onMonthChange={setMonthIdx}
      theme={theme} density={tweaks.density} isDesktop={isDesktop}
      onAdd={() => setScreen('add')}
      onDelete={handleDelete}
    />;
  } else if (screen === 'stats') {
    content = <StatsScreen txns={txns} theme={theme} isDesktop={isDesktop} monthIdx={monthIdx} />;
  } else if (screen === 'me') {
    content = <SettingsScreen theme={theme} isDesktop={isDesktop} tweaks={tweaks} setTweak={setTweak} />;
  } else {
    const titles = { history: 'ประวัติ' };
    content = <StubScreen title={titles[screen] || screen} theme={theme} />;
  }

  return (
    <>
      <div style={{ minHeight: '100vh', background: theme.bg, color: theme.ink }}>
        {isDesktop ? (
          <div style={{ display: 'grid', gridTemplateColumns: '244px minmax(0, 1fr)', minHeight: '100vh' }}>
            <Sidebar screen={screen} onScreen={setScreen} theme={theme} />
            <main style={{ padding: '32px 40px 48px', maxWidth: 1240, width: '100%', boxSizing: 'border-box' }}>
              {content}
            </main>
          </div>
        ) : (
          <div style={{ padding: '20px 18px 100px', maxWidth: 560, margin: '0 auto' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 4px 12px', fontSize: 16, fontWeight: 700,
              letterSpacing: -0.3, color: theme.ink,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 8, background: theme.accent,
                color: '#FFFCF7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
              }}>฿</div>
              Expense <span style={{ color: theme.accent }}>Tracker</span>
            </div>
            {content}
            <MobileTabBar screen={screen} onScreen={setScreen} theme={theme} />
          </div>
        )}

        {toast && (
          <div style={{
            position: 'fixed',
            left: '50%', bottom: isDesktop ? 32 : 110,
            transform: 'translateX(-50%)',
            background: theme.ink, color: theme.bg,
            padding: '11px 20px', borderRadius: 999,
            fontSize: 14, fontWeight: 600,
            fontFamily: 'Sarabun, system-ui',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 200, whiteSpace: 'nowrap',
          }}>{toast}</div>
        )}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakSelect label="Background" value={tweaks.theme}
            options={['cream', 'pure', 'dark']}
            onChange={(v) => setTweak('theme', v)} />
          <TweakColor label="Accent"
            value={ACCENTS[tweaks.accent]}
            options={[ACCENTS.teal, ACCENTS.indigo, ACCENTS.rust, ACCENTS.forest]}
            onChange={(v) => {
              const k = Object.keys(ACCENTS).find(x => ACCENTS[x] === v) || 'teal';
              setTweak('accent', k);
            }} />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Density" value={tweaks.density}
            options={['comfortable', 'compact']}
            onChange={(v) => setTweak('density', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

Object.assign(window, { App, HomeScreen, makeTheme, TWEAK_DEFAULTS, ACCENTS });

if (!window.__SUPPRESS_AUTO_MOUNT) {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}
