// data.jsx — categories, sample transactions, formatters

const CATEGORIES = {
  food:          { id: 'food',          label: 'อาหาร',     en: 'Food',          color: 'oklch(62% 0.14 35)',  bg: 'oklch(95% 0.025 35)'  },
  transport:     { id: 'transport',     label: 'เดินทาง',   en: 'Transport',     color: 'oklch(58% 0.13 230)', bg: 'oklch(95% 0.025 230)' },
  shopping:      { id: 'shopping',      label: 'ช้อปปิ้ง',  en: 'Shopping',      color: 'oklch(60% 0.14 330)', bg: 'oklch(95% 0.025 330)' },
  bills:         { id: 'bills',         label: 'บิล',       en: 'Bills',         color: 'oklch(58% 0.11 95)',  bg: 'oklch(95% 0.025 95)'  },
  entertainment: { id: 'entertainment', label: 'บันเทิง',   en: 'Fun',           color: 'oklch(60% 0.12 165)', bg: 'oklch(95% 0.025 165)' },
  health:        { id: 'health',        label: 'สุขภาพ',    en: 'Health',        color: 'oklch(60% 0.15 12)',  bg: 'oklch(95% 0.025 12)'  },
  education:     { id: 'education',     label: 'การศึกษา',  en: 'Edu',           color: 'oklch(55% 0.13 275)', bg: 'oklch(95% 0.025 275)' },
  other:         { id: 'other',         label: 'อื่นๆ',     en: 'Other',         color: 'oklch(55% 0.03 80)',  bg: 'oklch(95% 0.01 80)'   },
};

const INCOME_CATS = {
  salary:    { id: 'salary',    label: 'เงินเดือน',  en: 'Salary',    color: 'oklch(58% 0.14 155)', bg: 'oklch(95% 0.025 155)' },
  freelance: { id: 'freelance', label: 'ฟรีแลนซ์',   en: 'Freelance', color: 'oklch(56% 0.12 195)', bg: 'oklch(95% 0.025 195)' },
  bonus:     { id: 'bonus',     label: 'โบนัส',      en: 'Bonus',     color: 'oklch(62% 0.13 115)', bg: 'oklch(95% 0.025 115)' },
  other_in:  { id: 'other_in',  label: 'อื่นๆ',      en: 'Other',     color: 'oklch(55% 0.03 80)',  bg: 'oklch(95% 0.01 80)'   },
};

const getCat = (id) => CATEGORIES[id] || INCOME_CATS[id] || { label: '?', color: '#888', bg: '#eee' };

const SAMPLE_TXNS = [
  // May 2026 (current month)
  { id: 1,  type: 'expense', cat: 'food',          amount: 185,   note: 'ข้าวกะเพราไข่ดาว',     date: '2026-05-08' },
  { id: 2,  type: 'expense', cat: 'transport',     amount: 42,    note: 'BTS อโศก – อ่อนนุช',    date: '2026-05-08' },
  { id: 3,  type: 'expense', cat: 'food',          amount: 95,    note: 'กาแฟตอนเช้า',           date: '2026-05-08' },
  { id: 4,  type: 'expense', cat: 'shopping',      amount: 1250,  note: 'เสื้อยืดที่สยาม',       date: '2026-05-07' },
  { id: 5,  type: 'income',  cat: 'salary',        amount: 35000, note: 'เงินเดือนพฤษภาคม',     date: '2026-05-05' },
  { id: 6,  type: 'expense', cat: 'bills',         amount: 890,   note: 'ค่าไฟ',                 date: '2026-05-04' },
  { id: 7,  type: 'expense', cat: 'entertainment', amount: 350,   note: 'Netflix + Spotify',     date: '2026-05-03' },
  { id: 8,  type: 'expense', cat: 'food',          amount: 220,   note: 'อาหารกลางวัน',          date: '2026-05-03' },
  { id: 9,  type: 'income',  cat: 'freelance',     amount: 8500,  note: 'งานออกแบบโลโก้',        date: '2026-05-02' },
  { id: 10, type: 'expense', cat: 'health',        amount: 480,   note: 'วิตามิน',               date: '2026-05-02' },
  { id: 11, type: 'expense', cat: 'food',          amount: 145,   note: 'ส้มตำ + ไก่ย่าง',       date: '2026-05-01' },
  { id: 12, type: 'expense', cat: 'transport',     amount: 180,   note: 'Grab กลับบ้าน',         date: '2026-05-01' },
  // April 2026
  { id: 20, type: 'income',  cat: 'salary',        amount: 35000, note: 'เงินเดือนเมษายน',       date: '2026-04-05' },
  { id: 21, type: 'income',  cat: 'freelance',     amount: 12000, note: 'งานเว็บไซต์',           date: '2026-04-18' },
  { id: 22, type: 'expense', cat: 'food',          amount: 4200,  note: 'อาหารทั้งเดือน',        date: '2026-04-25' },
  { id: 23, type: 'expense', cat: 'transport',     amount: 1800,  note: 'BTS + Grab',            date: '2026-04-22' },
  { id: 24, type: 'expense', cat: 'shopping',      amount: 3500,  note: 'รองเท้าใหม่',           date: '2026-04-15' },
  { id: 25, type: 'expense', cat: 'bills',         amount: 2100,  note: 'ค่าไฟ + น้ำ',           date: '2026-04-04' },
  { id: 26, type: 'expense', cat: 'entertainment', amount: 1200,  note: 'ดูหนัง',                date: '2026-04-12' },
  // March 2026
  { id: 30, type: 'income',  cat: 'salary',        amount: 35000, note: 'เงินเดือนมีนาคม',       date: '2026-03-05' },
  { id: 31, type: 'income',  cat: 'bonus',         amount: 5000,  note: 'โบนัสไตรมาส',           date: '2026-03-28' },
  { id: 32, type: 'expense', cat: 'food',          amount: 4800,  note: 'อาหารทั้งเดือน',        date: '2026-03-25' },
  { id: 33, type: 'expense', cat: 'transport',     amount: 2200,  note: 'การเดินทาง',            date: '2026-03-22' },
  { id: 34, type: 'expense', cat: 'health',        amount: 3200,  note: 'หาหมอ',                 date: '2026-03-15' },
  { id: 35, type: 'expense', cat: 'bills',         amount: 1900,  note: 'ค่าไฟ + น้ำ',           date: '2026-03-04' },
  // February 2026
  { id: 40, type: 'income',  cat: 'salary',        amount: 35000, note: 'เงินเดือนกุมภาพันธ์',   date: '2026-02-05' },
  { id: 41, type: 'expense', cat: 'food',          amount: 4500,  note: 'อาหารทั้งเดือน',        date: '2026-02-25' },
  { id: 42, type: 'expense', cat: 'shopping',      amount: 6800,  note: 'ของขวัญวันวาเลนไทน์',   date: '2026-02-14' },
  { id: 43, type: 'expense', cat: 'transport',     amount: 1700,  note: 'การเดินทาง',            date: '2026-02-22' },
  { id: 44, type: 'expense', cat: 'bills',         amount: 2000,  note: 'ค่าไฟ + น้ำ',           date: '2026-02-04' },
  // January 2026
  { id: 50, type: 'income',  cat: 'salary',        amount: 35000, note: 'เงินเดือนมกราคม',       date: '2026-01-05' },
  { id: 51, type: 'income',  cat: 'freelance',     amount: 7500,  note: 'งานปีใหม่',             date: '2026-01-15' },
  { id: 52, type: 'expense', cat: 'food',          amount: 5200,  note: 'อาหารทั้งเดือน',        date: '2026-01-25' },
  { id: 53, type: 'expense', cat: 'entertainment', amount: 2800,  note: 'ปีใหม่',                date: '2026-01-01' },
  { id: 54, type: 'expense', cat: 'bills',         amount: 1850,  note: 'ค่าไฟ + น้ำ',           date: '2026-01-04' },
  { id: 55, type: 'expense', cat: 'shopping',      amount: 2400,  note: 'เสื้อผ้า',              date: '2026-01-20' },
];

const formatTHB = (n) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .format(Math.round(Math.abs(n)));

const TH_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const TH_MONTHS_FULL  = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

const formatDate = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`;
};

const formatDayLong = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  const days = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  return `${days[d.getDay()]} ${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]}`;
};

const TODAY = '2026-05-08';

Object.assign(window, {
  CATEGORIES, INCOME_CATS, getCat, SAMPLE_TXNS,
  formatTHB, formatDate, formatDayLong,
  TH_MONTHS_SHORT, TH_MONTHS_FULL, TODAY,
});
