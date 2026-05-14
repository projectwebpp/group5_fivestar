import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { logout } from "../api/auth";
import { color, font } from "../theme";

const NAV = [
  { to: "/expenses", label: "หน้าหลัก", glyph: "◉" },
  { to: "/expenses/new", label: "เพิ่มรายการ", glyph: "＋" },
  { to: "/analytics", label: "สถิติ", glyph: "▤" },
  { to: "/categories", label: "หมวดหมู่", glyph: "⊞" },
];

const TABS = [
  { to: "/expenses", label: "หน้าหลัก", glyph: "◉" },
  { to: "/analytics", label: "สถิติ", glyph: "▤" },
  { to: "/expenses/new", label: "", glyph: "＋", primary: true },
  { to: "/categories", label: "หมวดหมู่", glyph: "⊞" },
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 960);
  useEffect(() => {
    const h = () => setIsDesktop(window.innerWidth >= 960);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isDesktop;
}

// function getUserInitials(): string {
//   const email = localStorage.getItem("user_email") ?? "";
//   if (!email) return "?";
//   return email.slice(0, 2).toUpperCase();
// }

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();

  async function handleLogout() {
    try {
      await logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");
    navigate("/auth");
  }

  const isActive = (to: string) =>
    to === "/expenses"
      ? pathname === "/expenses" ||
        (pathname.startsWith("/expenses") && pathname !== "/expenses/new")
      : pathname === to || pathname.startsWith(to + "/");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: color.bg,
        color: color.text1,
        fontFamily: font,
      }}
    >
      {isDesktop ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "244px minmax(0,1fr)",
            minHeight: "100vh",
          }}
        >
          {/* Sidebar */}
          <aside
            style={{
              borderRight: `1px solid ${color.borderStrong}`,
              background: color.surface,
              padding: "28px 18px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              position: "sticky",
              top: 0,
              height: "100vh",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: color.text1,
                letterSpacing: -0.5,
                padding: "0 12px 24px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: color.accent,
                  color: "#FFFCF7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                ฿
              </div>
              <span>
                Expense <span style={{ color: color.accent }}>Tracker</span>
              </span>
            </div>

            {NAV.map((it) => {
              const active = isActive(it.to);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px",
                    borderRadius: 12,
                    background: active ? color.surfaceAlt : "transparent",
                    color: active ? color.text1 : color.text2,
                    fontSize: 15,
                    fontWeight: active ? 600 : 500,
                    transition: "all 160ms ease",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      fontSize: 16,
                      textAlign: "center",
                      color: active ? color.accent : color.text2,
                    }}
                  >
                    {it.glyph}
                  </span>
                  <span style={{ whiteSpace: "nowrap" }}>{it.label}</span>
                </Link>
              );
            })}

            <div style={{ flex: 1 }} />

            <button
              onClick={handleLogout}
              style={{
                all: "unset",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 16,
                borderRadius: 14,
                background: "#EF4444",
                boxSizing: "border-box",
                transition: "all 160ms ease",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fff",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  ออกจากระบบ
                </div>
              </div>
            </button>
          </aside>

          {/* Main */}
          <main
            style={{
              padding: "32px 40px 48px",
              maxWidth: 1240,
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {children}
          </main>
        </div>
      ) : (
        <>
          <div
            style={{
              padding: "16px 18px 100px",
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            {/* Mobile brand bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 4px 14px",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: -0.3,
                color: color.text1,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: color.accent,
                  color: "#FFFCF7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                ฿
              </div>
              Expense{" "}
              <span style={{ color: color.accent, marginLeft: 4 }}>
                Tracker
              </span>
            </div>
            {children}
          </div>

          {/* Mobile tab bar */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 10px)",
              paddingTop: 8,
              background: color.bg + "EE",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderTop: `1px solid ${color.borderStrong}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              zIndex: 30,
            }}
          >
            {TABS.map((t) => {
              if (t.primary) {
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    aria-label="เพิ่มรายการ"
                    style={{
                      textDecoration: "none",
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      background: color.accent,
                      color: "#FFFCF7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      fontWeight: 400,
                      lineHeight: 1,
                      marginTop: -16,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                    }}
                  >
                    +
                  </Link>
                );
              }
              const active = isActive(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    padding: "6px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      color: active ? color.text1 : color.text2,
                      lineHeight: 1,
                    }}
                  >
                    {t.glyph}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: active ? color.text1 : color.text2,
                      fontWeight: active ? 600 : 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
