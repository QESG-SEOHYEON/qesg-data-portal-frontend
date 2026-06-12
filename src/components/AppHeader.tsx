// 글로벌 GNB (마스터 명세 1장) — 홈 | 통합검색▾ | 워크스페이스▾ | 요금제 | 문의/제보 | (로그인)
// 통합검색▾: 조건검색·환경/사회/지배구조 대량테이블·뉴스·공시
// 워크스페이스▾: AI분석·기업비교·마이포트폴리오 (회원 전용)
// 미구현 항목은 "준비 중" 토스트. 좁아지면 햄버거로 접음.
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button, Dropdown, App } from "antd";
import { MenuOutlined, DownOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { colors } from "@/theme/tokens";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { LoginModal } from "@/pages/landing/components/LoginModal";

const SEARCH_ITEMS: MenuProps["items"] = [
  { key: "/bulk", label: "통합 검색" },
  { type: "divider" },
  { key: "/bulk?cat=E", label: "환경 (E)" },
  { key: "/bulk?cat=S", label: "사회 (S)" },
  { key: "/bulk?cat=G", label: "지배구조 (G)" },
  { type: "divider" },
  { key: "soon:news", label: "ESG 뉴스/소식" },
  { key: "soon:disclosure", label: "공시 정보" },
];
const WORKSPACE_ITEMS: MenuProps["items"] = [
  { key: "/workspace", label: "데이터 작업공간" },
  { key: "/portfolio", label: "내 포트폴리오" },
];

export function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const [loginOpen, setLoginOpen] = useState(false);

  // 키 라우팅 공통: soon:* → 준비중 토스트 / login → 모달 / 그 외 → 라우팅
  function handleKey(key: string) {
    if (key === "login") setLoginOpen(true);
    else if (key.startsWith("soon:")) message.info("준비 중입니다");
    else navigate(key);
  }
  const onMenuClick: MenuProps["onClick"] = ({ key }) => handleKey(key);

  const searchActive = pathname.startsWith("/bulk");

  // 모바일: 햄버거 하나에 전체(서브메뉴 포함) 접기
  const mobileItems: MenuProps["items"] = [
    { key: "/", label: "홈" },
    { key: "sub-search", label: "통합 검색", children: SEARCH_ITEMS },
    { key: "sub-ws", label: "워크스페이스", children: WORKSPACE_ITEMS },
    { key: "/pricing", label: "요금제" },
    { key: "soon:contact", label: "문의/제보" },
    { type: "divider" },
    { key: "login", label: "로그인" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 68,
        background: colors.bgSurface,
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 28,
      }}
    >
      {/* 로고 */}
      <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
        <img
          src="/logos/qesg.svg"
          alt="QESG"
          style={{ height: 32, width: "auto", display: "block" }}
        />
      </Link>

      {isMobile ? (
        <div style={{ marginLeft: "auto" }}>
          <Dropdown
            menu={{ items: mobileItems, onClick: onMenuClick }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" icon={<MenuOutlined style={{ fontSize: 18 }} />} />
          </Dropdown>
        </div>
      ) : (
        <>
          <nav style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <NavLink label="홈" to="/" active={pathname === "/"} onClick={() => navigate("/")} />

            <Dropdown
              menu={{ items: SEARCH_ITEMS, onClick: onMenuClick }}
              trigger={["click"]}
              placement="bottomLeft"
            >
              <button style={navItemStyle(searchActive)}>
                DATA <DownOutlined style={{ fontSize: 9 }} />
              </button>
            </Dropdown>

            <Dropdown
              menu={{ items: WORKSPACE_ITEMS, onClick: onMenuClick }}
              trigger={["click"]}
              placement="bottomLeft"
            >
              <button style={navItemStyle(false)}>
                워크스페이스 <DownOutlined style={{ fontSize: 9 }} />
              </button>
            </Dropdown>

            <NavLink
              label="요금제"
              to="/pricing"
              active={pathname === "/pricing"}
              onClick={() => navigate("/pricing")}
            />
            <NavLink
              label="문의/제보"
              to=""
              active={false}
              onClick={() => handleKey("soon:contact")}
            />
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

const navItemStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 15,
  fontWeight: active ? 700 : 500,
  color: active ? colors.textBase : colors.textSub,
  textDecoration: "none",
  borderBottom: active ? `2px solid ${colors.accent}` : "2px solid transparent",
  paddingBottom: 2,
  whiteSpace: "nowrap",
  cursor: "pointer",
  background: "none",
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
});

function NavLink({
  label,
  active,
  onClick,
}: {
  label: string;
  to: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={navItemStyle(active)}>
      {label}
    </button>
  );
}
