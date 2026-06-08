// HeroSearch (랜딩 명세 2.1) — 가치 제안 + 통합 검색 바 + 바로가기 칩
import type { IndicatorItem } from "@/types";
import { INDICATORS } from "@/mock/indicators";
import { colors, layout } from "@/theme/tokens";
import { SearchWidget } from "@/pages/search/components/SearchWidget";
import { CategoryBadge } from "@/pages/search/components/CategoryBadge";

// 바로가기 인기 지표 (명세: 온실가스 / 전자투표제 / 여성 임직원 비율)
const QUICK_IDS = ["E1", "G1", "S2"];
const QUICK = QUICK_IDS.map((id) => INDICATORS.find((i) => i.id === id)).filter(
  (i): i is IndicatorItem => !!i,
);

export function HeroSearch() {
  function handleQuick(item: IndicatorItem) {
    // eslint-disable-next-line no-console
    console.log("quick indicator:", item); // TODO: 지표 조회로 라우팅 (후속)
  }

  return (
    <section
      style={{
        background: `linear-gradient(180deg, #FFFFFF 0%, ${colors.bgPage} 100%)`,
        padding: "88px 20px 56px",
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", textAlign: "center" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 800,
            color: colors.textBase,
            letterSpacing: -0.6,
            lineHeight: 1.3,
          }}
        >
          (큐뎁 로고) 통합 ESG 데이터 포털
        </h1>
        <p style={{ margin: "12px 0 0", fontSize: 16, color: colors.textSub }}>
          국내 상장사 2,800개사 이상의 ESG 데이터를 한 번에 조회하세요.
        </p>

        <div style={{ marginTop: 32 }}>
          <SearchWidget />
        </div>

        {/* 바로가기 칩 */}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: colors.textHint, alignSelf: "center" }}>
            바로가기
          </span>
          {QUICK.map((ind) => (
            <button
              key={ind.id}
              onClick={() => handleQuick(ind)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 18,
                border: `1px solid ${colors.border}`,
                background: colors.bgSurface,
                color: colors.textBase,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <CategoryBadge category={ind.category} />
              {ind.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
