// ⭐ 데이터 소스 경계 (명세 3.3)
// 이 함수가 화면의 "유일한" 데이터 진입점이다.
// 실제 전환 시 이 함수 내부만 API 호출로 교체한다:
//   searchMock(query, scope) → GET /api/search?q={query}&scope={scope}
// 응답 형태 { companies: [...], indicators: [...] } 는 동일하게 유지한다.
import type { SearchResult, SearchScope } from "@/types";
import { COMPANIES } from "./companies";
import { INDICATORS } from "./indicators";

const norm = (s: string) => s.toLowerCase().replace(/\s/g, "");

export function searchMock(query: string, scope: SearchScope = "all"): SearchResult {
  const q = norm(query);
  if (!q) return { companies: [], indicators: [] };

  const companies =
    scope === "indicator"
      ? []
      : COMPANIES.filter((c) => norm(c.label).includes(q) || c.id.includes(q));

  const indicators =
    scope === "company"
      ? []
      : INDICATORS.filter(
          (i) => norm(i.label).includes(q) || i.aliases.some((a) => norm(a).includes(q)),
        );

  return { companies, indicators };
}

// 카테고리 브라우징용 — 검색어 없이 둘러보기.
// 이 역시 추후 GET /api/indicators?category={c} 등으로 교체 가능한 경계.
export function listIndicatorsByCategory(category: "E" | "S" | "G") {
  return INDICATORS.filter((i) => i.category === category);
}
