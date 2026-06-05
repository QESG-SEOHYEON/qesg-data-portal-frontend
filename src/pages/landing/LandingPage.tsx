// 비로그인 랜딩(메인)
// 섹션 순서: 검색 → 카탈로그(뭐가 있나) → 샘플 기업 미리보기(제품 맛보기) →
//   커버리지 → 신선도 → 출처 → 산업평균 비교 티저 → 가입 CTA
// teaser(샘플 미리보기·산업평균 비교)는 일부 노출 → 로그인 유도.
import { colors } from "@/theme/tokens";
import { HeroSearch } from "./components/HeroSearch";
import { DataCatalog } from "./components/DataCatalog";
import { CompanyDataFeed } from "./components/CompanyDataFeed";
import { SampleCompanyPreview } from "./components/SampleCompanyPreview";
import { CoverageStats } from "./components/CoverageStats";
import { RecentUpdates } from "./components/RecentUpdates";
import { SourceOverview } from "./components/SourceOverview";
import { IndustryAvgTeaser } from "./components/IndustryAvgTeaser";
import { SignupCTA } from "./components/SignupCTA";

export function LandingPage() {
  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <HeroSearch />
      <DataCatalog />
      <CompanyDataFeed />
      <SampleCompanyPreview />
      <CoverageStats />
      <RecentUpdates />
      <SourceOverview />
      <IndustryAvgTeaser />
      <SignupCTA />
    </main>
  );
}
