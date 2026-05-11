// add-screen.jsx — full-page Add Income / Expense form
// Works as a responsive page on desktop and mobile.

function AddScreen({ onSave, onCancel, theme, isDesktop }) {
  const [type, setType]   = React.useState('expense');
  const [amount, setAmount] = React.useState('');
  const [cat, setCat]     = React.useState('food');
  const [note, setNote]   = React.useState('');
  const [date, setDate]   = React.useState(TODAY);
  const [slip, setSlip]   = React.useState(null); // { name, dataUrl }
  const fileRef = React.useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setSlip({ name: file.name, dataUrl: e.target.result });
    reader.readAsDataURL(file);
  };
  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files && e.dataTransfer.files[0]);
  };

  React.useEffect(() => {
    const valid = type === 'income' ? Object.keys(INCOME_CATS) : Object.keys(CATEGORIES);
    if (!valid.includes(cat)) setCat(valid[0]);
  }, [type]);

  const cats = type === 'income' ? INCOME_CATS : CATEGORIES;
  const num = parseFloat(amount) || 0;
  const canSave = num > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ id: Date.now(), type, cat, amount: num, note: note.trim(), date, slip });
  };

  // numeric keypad helpers (mobile)
  const tap = (k) => {
    if (k === 'del') return setAmount(a => a.slice(0, -1));
    if (k === '.' && amount.includes('.')) return;
    if (k === '.' && amount === '') return setAmount('0.');
    if (amount.includes('.')) {
      const [, frac = ''] = amount.split('.');
      if (frac.length >= 2 && k !== 'del') return;
    }
    if (amount === '0' && k !== '.') return setAmount(k);
    setAmount(a => a + k);
  };

  const card = {
    background: theme.cardBg, borderRadius: 20, border: theme.cardBorder,
    boxShadow: theme.cardShadow,
  };

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: isDesktop ? '8px 0 64px' : '8px 0 120px',
      display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      {/* page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px 4px' }}>
        <button onClick={onCancel} style={{
          all: 'unset', cursor: 'pointer',
          width: 40, height: 40, borderRadius: 12,
          background: theme.subBg, color: theme.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, lineHeight: 1, flexShrink: 0,
        }} aria-label="ย้อนกลับ">←</button>
        <div style={{
          fontSize: isDesktop ? 26 : 22, fontWeight: 700, color: theme.ink,
          letterSpacing: -0.4, whiteSpace: 'nowrap',
        }}>
          เพิ่มรายการใหม่
        </div>
      </div>

      {/* type toggle */}
      <div style={{
        ...card, padding: 6,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
      }}>
        {[
          { id: 'expense', label: 'รายจ่าย' },
          { id: 'income',  label: 'รายรับ'  },
        ].map(opt => {
          const active = type === opt.id;
          const tone = opt.id === 'income' ? theme.income : theme.expense;
          return (
            <button
              key={opt.id} onClick={() => setType(opt.id)}
              style={{
                all: 'unset', cursor: 'pointer', textAlign: 'center',
                padding: '12px 0', borderRadius: 14,
                fontSize: 15, fontWeight: 600,
                background: active ? (opt.id === 'income' ? theme.income + '14' : theme.expense + '14') : 'transparent',
                color: active ? tone : theme.muted,
                transition: 'all 160ms ease',
              }}
            >{opt.label}</button>
          );
        })}
      </div>

      {/* amount */}
      <div style={{ ...card, padding: '24px 24px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: theme.muted, marginBottom: 6, letterSpacing: 0.2 }}>
          จำนวนเงิน (บาท)
        </div>
        {isDesktop ? (
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 600, color: theme.muted }}>฿</span>
            <input
              type="number" inputMode="decimal" placeholder="0"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{
                all: 'unset', textAlign: 'center', maxWidth: 320,
                fontSize: 56, fontWeight: 800, color: theme.ink,
                letterSpacing: -2, lineHeight: 1.1,
                fontVariantNumeric: 'tabular-nums',
                fontFamily: 'Sarabun, system-ui',
                borderBottom: `2px solid ${theme.divider}`,
                paddingBottom: 4,
              }}
            />
          </div>
        ) : (
          <div style={{
            fontSize: 56, fontWeight: 800, color: amount ? theme.ink : theme.muted,
            letterSpacing: -1.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: 30, fontWeight: 600, marginRight: 4, color: theme.muted }}>฿</span>
            {amount || '0'}
          </div>
        )}
      </div>

      {/* category grid */}
      <div style={{ ...card, padding: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, marginBottom: 14 }}>
          หมวดหมู่
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(8, 1fr)' : 'repeat(4, 1fr)',
          gap: 10,
        }}>
          {Object.values(cats).map(c => {
            const active = cat === c.id;
            return (
              <button
                key={c.id} onClick={() => setCat(c.id)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  padding: '12px 4px', borderRadius: 14,
                  background: active ? c.bg : 'transparent',
                  border: `1.5px solid ${active ? c.color : 'transparent'}`,
                  transition: 'all 160ms ease',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: c.bg, color: c.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{CAT_ICONS[c.id] || CAT_ICONS.other}</div>
                <div style={{
                  fontSize: 13, color: theme.ink, fontWeight: active ? 600 : 500,
                  textAlign: 'center', whiteSpace: 'nowrap',
                }}>{c.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* date + note */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '14px 18px',
          borderBottom: `1px solid ${theme.divider}`,
        }}>
          <div style={{ fontSize: 15, color: theme.ink, fontWeight: 500, flex: 1 }}>วันที่</div>
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{
              all: 'unset', fontSize: 15, color: theme.ink,
              fontFamily: 'Sarabun, system-ui', textAlign: 'right',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px' }}>
          <div style={{ fontSize: 15, color: theme.ink, fontWeight: 500, marginRight: 12, flexShrink: 0 }}>โน้ต</div>
          <input
            type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="พิมพ์รายละเอียด…"
            style={{
              all: 'unset', flex: 1, fontSize: 15,
              fontFamily: 'Sarabun, system-ui',
              color: theme.ink, textAlign: 'right', minWidth: 0,
            }}
          />
        </div>
      </div>

      {/* slip upload */}
      <div style={{ ...card, padding: 22 }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 12, gap: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>
            สลิป / ใบเสร็จ
          </div>
          <div style={{ fontSize: 12, color: theme.muted }}>(ไม่บังคับ)</div>
        </div>

        <input
          ref={fileRef} type="file" accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files && e.target.files[0])}
        />

        {slip ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: theme.subBg, borderRadius: 14, padding: 12,
          }}>
            <img
              src={slip.dataUrl} alt="สลิป"
              style={{
                width: 72, height: 72, objectFit: 'cover',
                borderRadius: 10, flexShrink: 0,
                border: `1px solid ${theme.divider}`,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 600, color: theme.ink,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{slip.name}</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>แนบสลิปเรียบร้อย</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => fileRef.current && fileRef.current.click()}
                style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '8px 12px', borderRadius: 10,
                  background: theme.cardBg, color: theme.ink,
                  fontSize: 13, fontWeight: 600,
                }}>เปลี่ยน</button>
              <button onClick={() => setSlip(null)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  padding: '8px 12px', borderRadius: 10,
                  background: 'transparent', color: theme.expense,
                  fontSize: 13, fontWeight: 600,
                }}>ลบ</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current && fileRef.current.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            style={{
              all: 'unset', cursor: 'pointer', display: 'block',
              width: '100%', boxSizing: 'border-box',
              padding: isDesktop ? '28px 16px' : '22px 16px',
              borderRadius: 14,
              border: `1.5px dashed ${theme.divider}`,
              background: theme.subBg,
              textAlign: 'center',
              transition: 'all 160ms ease',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: theme.cardBg, color: theme.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 10px', fontSize: 22, fontWeight: 600, lineHeight: 1,
            }}>↑</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>
              {isDesktop ? 'ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด' : 'แตะเพื่อเลือกไฟล์ภาพ'}
            </div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>
              รองรับไฟล์ JPG, PNG, HEIC
            </div>
          </button>
        )}
      </div>

      {/* mobile: numeric keypad */}
      {!isDesktop && (
        <div style={{ ...card, padding: 14 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          }}>
            {['1','2','3','4','5','6','7','8','9','.','0','del'].map(k => (
              <button
                key={k} onClick={() => tap(k)}
                style={{
                  all: 'unset', cursor: 'pointer',
                  textAlign: 'center', padding: '14px 0',
                  borderRadius: 12, background: theme.subBg, color: theme.ink,
                  fontSize: 22, fontWeight: 600,
                  fontFamily: 'Sarabun, system-ui',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >{k === 'del' ? '⌫' : k}</button>
            ))}
          </div>
        </div>
      )}

      {/* save button — always at the bottom of the form */}
      <button
        onClick={handleSave} disabled={!canSave}
        style={{
          all: 'unset', cursor: canSave ? 'pointer' : 'not-allowed',
          textAlign: 'center', padding: isDesktop ? '18px 0' : '16px 0',
          borderRadius: 16,
          background: canSave ? theme.accent : theme.subBg,
          color: canSave ? '#FFFCF7' : theme.muted,
          fontSize: isDesktop ? 17 : 16, fontWeight: 700,
          opacity: canSave ? 1 : 0.6,
          boxShadow: canSave ? '0 8px 20px rgba(0,0,0,0.12)' : 'none',
          transition: 'all 160ms ease',
        }}
      >บันทึกรายการ</button>
    </div>
  );
}

Object.assign(window, { AddScreen });
