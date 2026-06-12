// 개별 기업 ESG 상세 (개정 명세)
// 헤더 → ESG 다타입 테이블(추이 아코디언) → AI 질의 → 공시원문 → 유사기업
// 잠금은 플랜 셀렉터(access.ts tier). 평가·등급·전망 없음.
// ⚠️ 출처(데이터 소스) 표시는 사내 정책 확정 전까지 화면에서 끔 — 데이터/TrustBlock 컴포넌트는 유지, 렌더만 생략.
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation, useSearchParams, useNavigate } from "react-router";
import { Button, Empty } from "antd";
import { HeartOutlined } from "@ant-design/icons";
import type { Category } from "@/types";
import { getCompanyDetail, getCompanyCardMeta } from "@/mock/companyDetail";
import { pushRecentView } from "@/mock/recentViews";
import { usePlan } from "@/mock/planContext";
import { colors, categoryColors, layout } from "@/theme/tokens";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { RightRail } from "@/components/RightRail";
import { LoginModal } from "@/pages/landing/components/LoginModal";
import { PlanModal } from "@/pages/landing/components/PlanModal";
import { SaveToPortfolioModal } from "./components/SaveToPortfolioModal";
import { EsgIndicatorTable } from "./components/EsgIndicatorTable";
import { SanctionSection } from "./components/SanctionSection";
import { AskAboutCompany } from "./components/AskAboutCompany";
import { DisclosureSources } from "./components/DisclosureSources";
import { SimilarCompanies } from "./components/SimilarCompanies";

const CATEGORIES: Category[] = ["E", "S", "G"];

export function CompanyDetailPage() {
  const { companyId = "" } = useParams();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [sp] = useSearchParams();
  const focusCat = sp.get("cat"); // 그리드 셀 클릭 → 카테고리 포커싱
  const focusInd = sp.get("ind") ?? undefined; // 클릭한 지표 라벨(근사 매칭)
  const bp = useBreakpoint();
  const [plan, setPlan] = usePlan();
  const [tab, setTab] = useState<Category>("E");
  const [focusActive, setFocusActive] = useState(true); // 진입 시 포커싱 1회, 수동 탭 전환 시 해제
  const [loginOpen, setLoginOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false); // 관심 기업 저장(폴더 선택) 모달

  // 잠금 유도 — 비회원은 로그인, 그 외(개인X 등)는 플랜 안내
  const requireUpgrade = () => (plan === "guest" ? setLoginOpen(true) : setPlanOpen(true));

  const detail = useMemo(() => getCompanyDetail(companyId, plan), [companyId, plan]);

  // 최근 조회 이력 기록 (오른쪽 레일에서 사용)
  useEffect(() => {
    if (detail) pushRecentView({ id: detail.id, name: detail.name });
  }, [detail?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // 그리드 셀 클릭 진입(?cat=) 시 해당 카테고리 탭으로 전환
  useEffect(() => {
    if (focusCat && CATEGORIES.includes(focusCat as Category)) setTab(focusCat as Category);
  }, [focusCat]);

  // #sanctions 해시로 진입 시 제재 섹션으로 스크롤 — 스티키 헤더 밑 상단에 박히지 않고
  // 화면 상단 1/4 지점(시야 중앙부)에 오도록 오프셋 적용
  useEffect(() => {
    if (hash !== "#sanctions") return;
    const t = setTimeout(() => {
      const el = document.getElementById("sanctions");
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top - window.innerHeight * 0.25), behavior: "smooth" });
    }, 200);
    return () => clearTimeout(t);
  }, [hash, detail?.id]);

  if (!detail) {
    return (
      <Page>
        <Empty description="기업을 찾을 수 없습니다" style={{ marginTop: 80 }}>
          <Link to="/">검색으로 돌아가기</Link>
        </Empty>
      </Page>
    );
  }

  const showRail = bp === "wide";

  return (
    <Page
      rail={showRail ? <RightRail plan={plan} onPlanChange={setPlan} onLogin={() => setLoginOpen(true)} /> : undefined}
    >
      {/* ── 헤더 ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          margin: "12px 0 20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: colors.primary,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {detail.name.slice(0, 2)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: colors.textBase }}>
              {detail.name}
            </h1>
            <span
              style={{ fontSize: 14, color: colors.textSub, fontVariantNumeric: "tabular-nums" }}
            >
              {detail.id}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <MetaChip tone={META_TONES.sector}>{detail.industry}</MetaChip>
            <MetaChip tone={META_TONES.market}>{detail.market}</MetaChip>
            <MetaChip tone={META_TONES.size}>{detail.size}</MetaChip>
            {getCompanyCardMeta(detail.id).srPublished && (
              <MetaChip tone={META_TONES.sr}>FY{detail.baseYear} 지속가능경영보고서 공시</MetaChip>
            )}
          </div>
        </div>
        <Button
          icon={<HeartOutlined />}
          onClick={() => (plan === "guest" ? setLoginOpen(true) : setSaveOpen(true))}
        >
          관심기업 저장
        </Button>
      </div>

      {/* ── ESG 데이터 (다타입 테이블) ── */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {CATEGORIES.map((c) => {
          const meta = categoryColors[c];
          const isActive = tab === c;
          return (
            <button
              key={c}
              onClick={() => {
                setTab(c);
                setFocusActive(false); // 수동 전환 → 포커싱 초기화
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                border: "none",
                borderBottom: `2px solid ${isActive ? meta.fg : "transparent"}`,
                background: "transparent",
                color: isActive ? meta.fg : colors.textSub,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {meta.name} {c}
              <span
                style={{
                  background: isActive ? meta.bg : colors.bgPage,
                  color: isActive ? meta.fg : colors.textSub,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                  borderRadius: 10,
                }}
              >
                {detail.coverage[c]}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "4px 14px",
        }}
      >
        <EsgIndicatorTable
          rows={detail.indicators[tab]}
          trend={detail.trend}
          tier={plan}
          focusCode={focusActive && focusCat === tab ? focusInd : undefined}
          onSeeAll={() =>
            plan === "guest"
              ? setLoginOpen(true)
              : navigate(
                  `/bulk?cat=${tab}&company=${detail.id}&sector=${encodeURIComponent(detail.industry)}&full=1`,
                )
          }
        />
      </div>
      <div style={{ marginTop: 10, fontSize: 11.5, color: colors.textHint }}>
        공시 연도는 {detail.baseYear}년 기준입니다.
      </div>

      {/* ── 법규위반·제재 내역 ── */}
      <SanctionSection companyId={detail.id} tier={plan} onLocked={requireUpgrade} />

      {/* ── AI 질의 ── */}
      <AskAboutCompany
        detail={detail}
        tier={plan}
        onLogin={() => setLoginOpen(true)}
        onUpgrade={() => setPlanOpen(true)}
      />

      {/* ── 공시 원문 ── */}
      <DisclosureSources detail={detail} />

      {/* ── 유사 기업 ── */}
      <SimilarCompanies detail={detail} />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} />
      <SaveToPortfolioModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        company={{ id: detail.id, name: detail.name, sector: detail.industry }}
      />
    </Page>
  );
}

// 기업 메타 칩 — 검색 결과 카드와 동일 톤(중립색, 우열 아님)
const META_TONES = {
  sector: { bg: "#EEF3F8", fg: "#3F5E7A" },
  market: { bg: "#F2EFF8", fg: "#5A4F86" },
  size: { bg: "#F4F1EA", fg: "#6E5A36" },
  sr: { bg: "#E9F3EF", fg: "#3E6B5C" },
};
function MetaChip({ tone, children }: { tone: { bg: string; fg: string }; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: tone.fg,
        background: tone.bg,
        padding: "3px 9px",
        borderRadius: 4,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Page({ children, rail }: { children: React.ReactNode; rail?: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div
        style={{
          maxWidth: rail ? layout.wideMaxWidth : layout.contentMaxWidth,
          margin: "0 auto",
          padding: "32px 20px 80px",
          display: rail ? "flex" : "block",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: rail ? 1 : undefined, minWidth: 0 }}>{children}</div>
        {rail && (
          <aside style={{ width: 300, flexShrink: 0, position: "sticky", top: 84 }}>{rail}</aside>
        )}
      </div>
    </main>
  );
}
