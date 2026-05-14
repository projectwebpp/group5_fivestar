import React from "react";

const _p = {
  width: "60%",
  height: "60%",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<string, React.ReactElement> = {
  food: (
    <svg {..._p}>
      <path d="M4 11h16" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 4v3" />
    </svg>
  ),
  transport: (
    <svg {..._p}>
      <path d="M5 16V10l2-5h10l2 5v6" />
      <path d="M3 16h18" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  ),
  shopping: (
    <svg {..._p}>
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  bills: (
    <svg {..._p}>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  ),
  entertainment: (
    <svg {..._p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 9.5v5l4-2.5-4-2.5z" />
    </svg>
  ),
  health: (
    <svg {..._p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  ),
  education: (
    <svg {..._p}>
      <path d="M3 5h7a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H3V5z" />
      <path d="M21 5h-7a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h7V5z" />
    </svg>
  ),
  salary: (
    <svg {..._p}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  housing: (
    <svg {..._p}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),

  business: (
    <svg {..._p}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  ),

  utilities: (
    <svg {..._p}>
      <path d="M13 2L6 14h5l-1 8 7-12h-5l1-8z" />
    </svg>
  ),
  other: (
    <svg {..._p}>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const CAT_COLORS: Record<string, { color: string; bg: string }> = {
  food: { color: "oklch(62% 0.14 35)", bg: "oklch(95% 0.025 35)" },
  transport: { color: "oklch(58% 0.13 230)", bg: "oklch(95% 0.025 230)" },
  shopping: { color: "oklch(60% 0.14 330)", bg: "oklch(95% 0.025 330)" },
  bills: { color: "oklch(58% 0.11 95)", bg: "oklch(95% 0.025 95)" },
  entertainment: { color: "oklch(60% 0.12 165)", bg: "oklch(95% 0.025 165)" },
  health: { color: "oklch(60% 0.15 12)", bg: "oklch(95% 0.025 12)" },
  education: { color: "oklch(55% 0.13 275)", bg: "oklch(95% 0.025 275)" },
  salary: { color: "oklch(58% 0.14 155)", bg: "oklch(95% 0.025 155)" },
  housing: {
    color: "oklch(58% 0.08 40)",
    bg: "oklch(95% 0.02 40)",
  },

  business: {
    color: "oklch(55% 0.09 250)",
    bg: "oklch(95% 0.02 250)",
  },

  utilities: {
    color: "oklch(60% 0.12 85)",
    bg: "oklch(95% 0.02 85)",
  },
  other: { color: "oklch(55% 0.03 80)", bg: "oklch(95% 0.01 80)" },
};

export function categoryKey(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("food") || n.includes("อาหาร") || n.includes("กิน"))
    return "food";
  if (
    n.includes("transport") ||
    n.includes("เดินทาง") ||
    n.includes("travel") ||
    n.includes("car") ||
    n.includes("grab") ||
    n.includes("bts")
  )
    return "transport";
  if (n.includes("food") || n.includes("อาหาร") || n.includes("กิน"))
    return "food";
  if (
    n.includes("shop") ||
    n.includes("ช้อป") ||
    n.includes("buy") ||
    n.includes("ซื้อ")
  )
    return "shopping";
  if (
    n.includes("bill") ||
    n.includes("บิล") ||
    n.includes("utility") ||
    n.includes("ค่าไฟ") ||
    n.includes("ค่าน้ำ")
  )
    return "bills";
  if (
    n.includes("entertainment") ||
    n.includes("บันเทิง") ||
    n.includes("movie") ||
    n.includes("fun") ||
    n.includes("game")
  )
    return "entertainment";
  if (
    n.includes("health") ||
    n.includes("สุขภาพ") ||
    n.includes("medical") ||
    n.includes("หมอ") ||
    n.includes("ยา")
  )
    return "health";
  if (
    n.includes("education") ||
    n.includes("การศึกษา") ||
    n.includes("school") ||
    n.includes("course")
  )
    return "education";
  if (
    n.includes("salary") ||
    n.includes("เงินเดือน") ||
    n.includes("income") ||
    n.includes("wage")
  )
    return "salary";
  if (n.includes("housing")) return "housing";
  if (n.includes("business")) return "business";
  if (n.includes("utilities")) return "utilities";
  return "other";
}

export function getCategoryStyle(
  name: string,
  apiColor?: string,
): { color: string; bg: string } {
  const key = categoryKey(name);
  if (CAT_COLORS[key]) return CAT_COLORS[key];
  if (apiColor) {
    return { color: apiColor, bg: apiColor + "22" };
  }
  return CAT_COLORS.other;
}

interface CategoryChipProps {
  name: string;
  apiColor?: string;
  size?: number;
}

export default function CategoryChip({
  name,
  apiColor,
  size = 42,
}: CategoryChipProps) {
  const key = categoryKey(name);
  const style = getCategoryStyle(name, apiColor);
  const r = Math.round(size * 0.32);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: style.bg,
        color: style.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {ICONS[key] || ICONS.other}
    </div>
  );
}
