// settings-screen.jsx — Account / settings page

function SettingsScreen({ theme, isDesktop, tweaks, setTweak }) {
  const [profile, setProfile] = React.useState({
    name: 'คุณนภัส', email: 'napas@example.com',
    currency: 'THB', language: 'th',
  });
  const [notif, setNotif] = React.useState({ daily: true, monthly: true, budget: false });

  const card = {
    background: theme.cardBg, borderRadius: 20,
    border: theme.cardBorder, boxShadow: theme.cardShadow,
    overflow: 'hidden',
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: isDesktop ? 28 : 22, fontWeight: 700,
          color: theme.ink, letterSpacing: -0.4,
        }}>ตั้งค่าบัญชี</div>
        <div style={{ fontSize: 14, color: theme.muted, marginTop: 4 }}>
          จัดการข้อมูลส่วนตัวและการตั้งค่าแอป
        </div>
      </div>

      {/* Profile card */}
      <div style={{ ...card, padding: 22, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999,
            background: theme.subBg, color: theme.ink,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, flexShrink: 0,
          }}>นภ</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 18, fontWeight: 700, color: theme.ink,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{profile.name}</div>
            <div style={{
              fontSize: 13, color: theme.muted, marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{profile.email}</div>
          </div>
          <button style={smallBtn(theme)}>เปลี่ยนรูป</button>
        </div>
      </div>

      {/* Account info */}
      <SettingGroup title="ข้อมูลส่วนตัว" theme={theme}>
        <SettingField label="ชื่อ" theme={theme}
          value={profile.name}
          onChange={(v) => setProfile({ ...profile, name: v })} />
        <SettingField label="อีเมล" theme={theme} type="email"
          value={profile.email}
          onChange={(v) => setProfile({ ...profile, email: v })} />
        <SettingSelect label="สกุลเงิน" theme={theme}
          value={profile.currency}
          options={[['THB','฿ บาท (THB)'],['USD','$ ดอลลาร์ (USD)'],['EUR','€ ยูโร (EUR)'],['JPY','¥ เยน (JPY)']]}
          onChange={(v) => setProfile({ ...profile, currency: v })} />
        <SettingSelect label="ภาษา" theme={theme}
          value={profile.language}
          options={[['th','ไทย'],['en','English']]}
          onChange={(v) => setProfile({ ...profile, language: v })} />
      </SettingGroup>

      {/* Appearance */}
      <SettingGroup title="ลักษณะการแสดงผล" theme={theme}>
        <SettingPick label="ธีมพื้นหลัง" theme={theme}
          value={tweaks.theme}
          options={[['cream','ครีม'],['pure','ขาว'],['dark','มืด']]}
          onChange={(v) => setTweak('theme', v)} />
        <SettingPick label="สีหลัก" theme={theme}
          value={tweaks.accent}
          options={[['teal','เขียวน้ำเงิน'],['indigo','คราม'],['rust','ส้มอิฐ'],['forest','เขียวป่า']]}
          onChange={(v) => setTweak('accent', v)} />
        <SettingPick label="ความหนาแน่น" theme={theme}
          value={tweaks.density}
          options={[['comfortable','ปกติ'],['compact','กะทัดรัด']]}
          onChange={(v) => setTweak('density', v)} />
      </SettingGroup>

      {/* Notifications */}
      <SettingGroup title="การแจ้งเตือน" theme={theme}>
        <SettingToggle label="สรุปประจำวัน" sub="แจ้งยอดใช้จ่ายของวันก่อน"
          theme={theme} value={notif.daily}
          onChange={(v) => setNotif({ ...notif, daily: v })} />
        <SettingToggle label="สรุปสิ้นเดือน" sub="ส่งรายงานสิ้นเดือนทางอีเมล"
          theme={theme} value={notif.monthly}
          onChange={(v) => setNotif({ ...notif, monthly: v })} />
        <SettingToggle label="เตือนเมื่อใกล้ถึงงบ" sub="แจ้งเมื่อยอดใช้จ่ายเกิน 80% ของงบ"
          theme={theme} value={notif.budget}
          onChange={(v) => setNotif({ ...notif, budget: v })} />
      </SettingGroup>

      {/* Data & privacy */}
      <SettingGroup title="ข้อมูลและความเป็นส่วนตัว" theme={theme}>
        <SettingAction label="ส่งออกข้อมูล (CSV)" sub="ดาวน์โหลดรายการทั้งหมดของคุณ"
          theme={theme} action="ส่งออก" />
        <SettingAction label="เปลี่ยนรหัสผ่าน" sub="อัปเดตรหัสผ่านบัญชี"
          theme={theme} action="เปลี่ยน" />
        <SettingAction label="ลบบัญชีถาวร" sub="ลบข้อมูลทั้งหมดและบัญชีของคุณ"
          theme={theme} action="ลบบัญชี" danger />
      </SettingGroup>

      {/* Logout */}
      <button style={{
        all: 'unset', cursor: 'pointer',
        display: 'block', width: '100%', textAlign: 'center',
        padding: '14px 18px', borderRadius: 14,
        background: theme.cardBg, border: theme.cardBorder,
        boxShadow: theme.cardShadow,
        fontSize: 15, fontWeight: 600, color: theme.expense,
        marginBottom: 12, boxSizing: 'border-box',
      }}>ออกจากระบบ</button>

      <div style={{
        textAlign: 'center', fontSize: 12, color: theme.muted,
        padding: '8px 0 24px',
      }}>
        Expense Tracker · เวอร์ชัน 1.0.0
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────

function SettingGroup({ title, theme, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: theme.muted,
        letterSpacing: 0.6, textTransform: 'uppercase',
        padding: '0 4px 10px',
      }}>{title}</div>
      <div style={{
        background: theme.cardBg, borderRadius: 20,
        border: theme.cardBorder, boxShadow: theme.cardShadow,
        overflow: 'hidden',
      }}>
        {React.Children.map(children, (child, i) => (
          <div style={{
            borderTop: i === 0 ? 'none' : `1px solid ${theme.divider}`,
          }}>{child}</div>
        ))}
      </div>
    </div>
  );
}

function SettingRow({ children, theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 18px', minHeight: 56, boxSizing: 'border-box',
    }}>{children}</div>
  );
}

function SettingField({ label, value, onChange, theme, type = 'text' }) {
  return (
    <SettingRow theme={theme}>
      <div style={{ fontSize: 15, color: theme.ink, fontWeight: 500, minWidth: 96 }}>{label}</div>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1, fontSize: 15, color: theme.ink,
          background: 'transparent', border: 'none', outline: 'none',
          textAlign: 'right', fontFamily: 'inherit',
          minWidth: 0,
        }}
      />
    </SettingRow>
  );
}

function SettingSelect({ label, value, options, onChange, theme }) {
  return (
    <SettingRow theme={theme}>
      <div style={{ fontSize: 15, color: theme.ink, fontWeight: 500, flex: 1 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{
          fontSize: 14, color: theme.ink, fontWeight: 500,
          background: theme.subBg, border: 'none', outline: 'none',
          padding: '8px 10px', borderRadius: 10,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </SettingRow>
  );
}

function SettingPick({ label, value, options, onChange, theme }) {
  return (
    <SettingRow theme={theme}>
      <div style={{ fontSize: 15, color: theme.ink, fontWeight: 500, flex: 1 }}>{label}</div>
      <div style={{
        display: 'flex', gap: 4, background: theme.subBg,
        padding: 4, borderRadius: 10,
      }}>
        {options.map(([v, l]) => {
          const active = value === v;
          return (
            <button key={v} onClick={() => onChange(v)}
              style={{
                all: 'unset', cursor: 'pointer',
                padding: '6px 12px', borderRadius: 7,
                background: active ? theme.cardBg : 'transparent',
                color: active ? theme.ink : theme.muted,
                fontSize: 13, fontWeight: active ? 600 : 500,
                whiteSpace: 'nowrap',
              }}>{l}</button>
          );
        })}
      </div>
    </SettingRow>
  );
}

function SettingToggle({ label, sub, value, onChange, theme }) {
  return (
    <SettingRow theme={theme}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, color: theme.ink, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        aria-label={label}
        style={{
          all: 'unset', cursor: 'pointer',
          width: 44, height: 26, borderRadius: 999,
          background: value ? theme.accent : theme.subBg,
          position: 'relative', transition: 'background 160ms ease',
          flexShrink: 0,
        }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 21 : 3,
          width: 20, height: 20, borderRadius: 999,
          background: '#FFFCF7',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 160ms ease',
        }} />
      </button>
    </SettingRow>
  );
}

function SettingAction({ label, sub, action, theme, danger }) {
  return (
    <SettingRow theme={theme}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, color: danger ? theme.expense : theme.ink, fontWeight: 500,
        }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <button style={smallBtn(theme, danger)}>{action}</button>
    </SettingRow>
  );
}

function smallBtn(theme, danger) {
  return {
    all: 'unset', cursor: 'pointer',
    padding: '8px 14px', borderRadius: 10,
    background: danger ? theme.expense + '14' : theme.subBg,
    color: danger ? theme.expense : theme.ink,
    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
  };
}

Object.assign(window, { SettingsScreen });
