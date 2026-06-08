// 글로벌 헤더 — 로고 + 메뉴 + 로그인. 전 화면 공통(Layout에서 렌더).
// 좁아지면(모바일) 메뉴가 로그인 버튼과 겹치지 않도록 햄버거로 접는다(요소 단위 숨김).
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button, Dropdown } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { colors } from "@/theme/tokens";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { LoginModal } from "@/pages/landing/components/LoginModal";

const NAV = [
  { label: "홈", to: "/" },
  { label: "통합 검색", to: "/bulk" },
];

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const [loginOpen, setLoginOpen] = useState(false);

  const menuItems: MenuProps["items"] = [
    ...NAV.map((n) => ({ key: n.to, label: n.label })),
    { type: "divider" as const },
    { key: "login", label: "로그인" },
  ];
  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "login") setLoginOpen(true);
    else navigate(key);
  };

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

      {isMobile ? (
        /* 모바일: 햄버거로 메뉴+로그인 접기 (겹침 방지) */
        <div style={{ marginLeft: "auto" }}>
          <Dropdown
            menu={{ items: menuItems, onClick: onMenuClick }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MenuOutlined style={{ fontSize: 18 }} />} />
          </Dropdown>
        </div>
      ) : (
        <>
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
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div style={{ marginLeft: "auto" }}>
            <Button type="primary" onClick={() => setLoginOpen(true)}>
              로그인
            </Button>
          </div>
        </>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
