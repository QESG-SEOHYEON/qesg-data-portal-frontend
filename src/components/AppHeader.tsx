// 글로벌 헤더 — 로고 + 메뉴 + 로그인. 전 화면 공통(Layout에서 렌더).
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "antd";
import { colors } from "@/theme/tokens";
import { LoginModal } from "@/pages/landing/components/LoginModal";

const NAV = [
  { label: "홈", to: "/" },
  { label: "기업 ESG 정보 검색", to: "/bulk" },
];

export function AppHeader() {
  const { pathname } = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 56,
        background: colors.bgSurface,
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 24,
      }}
    >
      {/* 로고 (목업 플레이스홀더 — 실제 로고 이미지로 교체 예정) */}
      <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 30,
            padding: "0 12px",
            border: `1px dashed ${colors.border}`,
            borderRadius: 6,
            background: colors.bgPage,
            color: colors.textSub,
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          (큐뎁 로고)
        </span>
      </Link>

      {/* 메뉴 */}
      <nav style={{ display: "flex", gap: 18, alignItems: "center" }}>
        {NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? colors.textBase : colors.textSub,
                textDecoration: "none",
                borderBottom: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                paddingBottom: 2,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 우측: 로그인 */}
      <div style={{ marginLeft: "auto" }}>
        <Button type="primary" onClick={() => setLoginOpen(true)}>
          로그인
        </Button>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
