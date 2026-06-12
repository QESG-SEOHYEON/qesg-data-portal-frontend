// 마이 포트폴리오 — 저장소(작업이 쌓이는 곳). 저장한 작업 / 관심 기업 / 다운로드 이력.
// 작업공간에서 [저장] → 여기 쌓임. [열기] → 그 상태로 작업공간 복원(/workspace?load=id).
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Empty, Modal, Input, App } from "antd";
import {
  FolderOpenOutlined,
  DownloadOutlined,
  RightOutlined,
  TableOutlined,
  RobotOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  getSavedWorks,
  getFavoriteCompanies,
  getDownloads,
  getPortfolios,
  savePortfolio,
} from "@/mock/workspace";
import { usePlan } from "@/mock/planContext";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { RightRail } from "@/components/RightRail";
import { LoginModal } from "@/pages/landing/components/LoginModal";
import { colors, layout } from "@/theme/tokens";

export function PortfolioPage() {
  const navigate = useNavigate();
  // localStorage 변동 반영용 단발 read (저장 후 재진입 시 갱신)
  const { message } = App.useApp();
  const [works] = useState(() => getSavedWorks());
  const [portfolios, setPortfolios] = useState(() => getPortfolios());
  const favorites = getFavoriteCompanies();
  const downloads = getDownloads();

  // 새 기업리스트(빈 폴더) 추가
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const doAdd = () => {
    if (!newName.trim()) return;
    savePortfolio(newName.trim(), []);
    setPortfolios(getPortfolios());
    setAddOpen(false);
    setNewName("");
    message.success("기업리스트를 만들었어요");
  };

  const bp = useBreakpoint();
  const showRail = bp === "wide";
  const [plan, setPlan] = usePlan();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div
        style={{
          maxWidth: showRail ? layout.wideMaxWidth : layout.contentMaxWidth,
          margin: "0 auto",
          padding: "24px 20px",
          display: showRail ? "flex" : "block",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: showRail ? 1 : undefined, minWidth: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.textBase, margin: "0 0 4px" }}>
          내 포트폴리오
        </h1>
        <div style={{ fontSize: 13.5, color: colors.textSub, marginBottom: 24 }}>
          데이터 작업공간에서 저장한 작업과 관심 기업을 모아둔 보관함입니다.
        </div>

        {/* 저장한 작업 */}
        <Section title="저장한 작업" count={works.length}>
          {works.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="저장한 작업이 없어요. 작업공간에서 [저장]을 눌러 보관하세요."
            >
              <Button
                type="primary"
                onClick={() => navigate("/workspace")}
                style={{ background: colors.primary, borderColor: colors.primary }}
              >
                데이터 작업공간 열기
              </Button>
            </Empty>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {/* 새 작업 — 빈 워크스페이스로 시작 */}
              <button
                onClick={() => navigate("/workspace")}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  minHeight: 108,
                  border: `1.5px dashed ${colors.border}`,
                  background: colors.bgSurface,
                  borderRadius: 12,
                  cursor: "pointer",
                  color: colors.primary,
                }}
              >
                <PlusOutlined style={{ fontSize: 18 }} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>새 작업</span>
              </button>
              {works.map((w) => (
                <div
                  key={w.id}
                  style={{
                    background: colors.bgSurface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: colors.textBase,
                      marginBottom: 6,
                    }}
                  >
                    {w.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: colors.textSub }}>
                    {w.companyIds.length}종목 · 지표 {w.indicatorIds.length}개
                    {w.showSanctions ? " · 제재" : ""}
                  </div>
                  <div style={{ fontSize: 11.5, color: colors.textHint, marginTop: 2 }}>
                    저장일 {w.savedAt}
                  </div>
                  <Button
                    size="small"
                    icon={<FolderOpenOutlined />}
                    onClick={() => navigate(`/workspace?load=${w.id}`)}
                    style={{ marginTop: 12 }}
                  >
                    열기
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* 내 기업리스트 (포트폴리오) — 통합조회에서 저장 / 여기서 조회·작업 */}
        <Section title="내 기업리스트" count={portfolios.length}>
          <div style={{ fontSize: 12.5, color: colors.textHint, marginBottom: 12 }}>
            통합 데이터 조회에서 기업을 담아 저장하면 여기에 쌓입니다. 불러와서 조회하거나 워크스페이스에서 작업하세요.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {/* 새 기업리스트 추가 */}
            <button
              onClick={() => setAddOpen(true)}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.accent)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                minHeight: 108,
                border: `1.5px dashed ${colors.border}`,
                background: colors.bgSurface,
                borderRadius: 12,
                cursor: "pointer",
                color: colors.primary,
              }}
            >
              <PlusOutlined style={{ fontSize: 18 }} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>새 기업리스트</span>
            </button>
            {portfolios.map((p) => (
              <div
                key={p.id}
                style={{
                  background: colors.bgSurface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.textBase, marginBottom: 6 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 12.5, color: colors.textSub }}>
                  {p.companyIds.length}곳
                  {p.savedAt ? ` · 저장일 ${p.savedAt}` : " · 기본 제공"}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button
                    size="small"
                    icon={<TableOutlined />}
                    onClick={() => navigate(`/bulk?pf=${p.id}`)}
                  >
                    데이터 조회
                  </Button>
                  <Button
                    size="small"
                    icon={<RobotOutlined />}
                    onClick={() => navigate(`/workspace?pf=${p.id}`)}
                  >
                    워크스페이스에서 작업하기
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 관심 기업 */}
        <Section title="관심 기업" count={favorites.length}>
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              overflow: "hidden",
              background: colors.bgSurface,
            }}
          >
            {favorites.map((c, i) => (
              <div
                key={c.id}
                onClick={() => navigate(`/company/${c.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgPage)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  cursor: "pointer",
                  borderTop: i === 0 ? "none" : `1px solid ${colors.border}`,
                }}
              >
                <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.primary }}>
                  {c.name}
                </span>
                <span style={{ fontSize: 12, color: colors.textSub }}>
                  {c.id} · {c.sector}
                </span>
                <RightOutlined
                  style={{ marginLeft: "auto", fontSize: 11, color: colors.textHint }}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* 다운로드 이력 (플랜 회원) */}
        <Section title="다운로드 이력" count={downloads.length}>
          <div
            style={{
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              overflow: "hidden",
              background: colors.bgSurface,
            }}
          >
            {downloads.map((d, i) => (
              <div
                key={d.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderTop: i === 0 ? "none" : `1px solid ${colors.border}`,
                }}
              >
                <DownloadOutlined style={{ color: colors.textHint }} />
                <span style={{ fontSize: 13.5, color: colors.textBase }}>{d.name}</span>
                <span style={{ fontSize: 11.5, color: colors.textHint }}>{d.kind}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: colors.textHint }}>
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </Section>
        </div>

        {showRail && (
          <aside style={{ width: 300, flexShrink: 0, position: "sticky", top: 84 }}>
            <RightRail plan={plan} onPlanChange={setPlan} onLogin={() => setLoginOpen(true)} />
          </aside>
        )}
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* 새 기업리스트 만들기 */}
      <Modal
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={doAdd}
        okText="만들기"
        cancelText="닫기"
        title="새 기업리스트"
        centered
        width={420}
      >
        <div style={{ fontSize: 13, color: colors.textSub, marginBottom: 10 }}>
          빈 기업리스트를 만든 뒤, 기업 페이지의 [관심기업 저장]이나 통합 조회에서 기업을 담을 수 있어요.
        </div>
        <Input
          placeholder="예: 반도체 관심군"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={doAdd}
        />
      </Modal>
    </main>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: colors.textBase, marginBottom: 12 }}>
        {title} <span style={{ color: colors.accent }}>{count}</span>
      </div>
      {children}
    </section>
  );
}
