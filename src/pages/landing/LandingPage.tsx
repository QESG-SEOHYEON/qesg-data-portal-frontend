// 비로그인 랜딩(메인)
// 반응형 우선순위 (스펙 8장):
//  - 1순위 항상 노출: 검색 · 커버리지 · 카탈로그 (+ 가입 CTA)
//  - 2순위 좁으면 접기: 산업비교 · 공시율 · 기업 데이터 피드 (모바일 숨김)
//  - 3순위 먼저 축소/숨김: 섹터트렌드(데스크톱+) · 최근업데이트 · 출처현황(모바일 숨김)
//  - 데스크톱: 최근업데이트 ↔ 출처현황 가로 2단
//  - 와이드(≥1280): 우측 sticky 레일에 최근업데이트(세로) + 가입 CTA 부착
import { useState } from "react";
import { Button } from "antd";
import { colors, layout } from "@/theme/tokens";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { getCoverageStats } from "@/mock/landing";
import { HeroSearch } from "./components/HeroSearch";
import { DataCatalog } from "./components/DataCatalog";
import { CompanyDataFeed } from "./components/CompanyDataFeed";
import { CoverageStats } from "./components/CoverageStats";
import { IndustryCompare } from "./components/IndustryCompare";
import { SectorTrend } from "./components/SectorTrend";
import { RecentUpdates } from "./components/RecentUpdates";
import { SrDisclosureStatus } from "./components/SrDisclosureStatus";
import { EsgNews } from "./components/EsgNews";
import { SignupCTA } from "./components/SignupCTA";
import { LoginModal } from "./components/LoginModal";

export function LandingPage() {
  const bp = useBreakpoint();
  const [loginOpen, setLoginOpen] = useState(false);
  const isMobile = bp === "mobile";
  const isDesktop = bp === "desktop";
  const isWide = bp === "wide";
  const showSecondary = !isMobile; // 2순위

  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      {/* 1순위 — 항상 (전폭) */}
      <HeroSearch />

      {isWide ? (
        /* 와이드: 본문(좌) + sticky 레일(우) */
        <div
          style={{
            display: "flex",
            gap: 24,
            maxWidth: layout.wideMaxWidth,
            margin: "0 auto",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <DataCatalog />
            <CompanyDataFeed />
            <IndustrySectorPair />
            <EsgNews />
            <SrDisclosureStatus />
          </div>
          <aside
            style={{
              width: 300,
              flexShrink: 0,
              position: "sticky",
              top: 72,
              padding: "44px 20px 0 0",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <RecentUpdates embedded />
            <RailSignupCard onClick={() => setLoginOpen(true)} />
          </aside>
        </div>
      ) : (
        <>
          <DataCatalog />
          {/* 항상 노출(모바일 포함): 기업 ESG 데이터 · 산업군 데이터 · ESG 뉴스 */}
          <CompanyDataFeed />
          {/* 산업군 데이터 + 섹터 트렌드: 데스크톱 2단 / 태블릿·모바일은 세로로 쌓음 */}
          <IndustrySectorPair stack={!isDesktop} />
          <EsgNews />
          {/* 최근 업데이트는 와이드 우측 레일 전용 → 여기선 SR 공시 현황만 */}
          {showSecondary && <SrDisclosureStatus />}
        </>
      )}

      {/* 커버리지 하이라이트 — 홍보성 시각효과, 가입 CTA 바로 위(전폭) */}
      <CoverageStats />
      {/* 항상 — 전환 (전폭) */}
      <SignupCTA />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}

// 산업군 데이터 + 섹터 트렌드. 넓으면 가로 2단, 좁으면(stack) 섹터 트렌드를 아래로 쌓음.
function IndustrySectorPair({ stack = false }: { stack?: boolean }) {
  return (
    <section style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", padding: "44px 20px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: stack ? "1fr" : "1fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <IndustryCompare embedded />
        <SectorTrend embedded />
      </div>
    </section>
  );
}

// 우측 레일 가입 유도 미니 카드 (와이드 전용)
function RailSignupCard({ onClick }: { onClick: () => void }) {
  const total = getCoverageStats().indicators;
  return (
    <div
      style={{
        background: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: colors.textBase }}>
        전체 {total}개 지표 열람
      </div>
      <div style={{ fontSize: 12.5, color: colors.textSub, margin: "6px 0 12px", lineHeight: 1.5 }}>
        기업별 상세·다개년 추이·출처까지 로그인 후 모두 확인하세요
      </div>
      <Button type="primary" block onClick={onClick}>
        로그인 / 회원가입
      </Button>
    </div>
  );
}
