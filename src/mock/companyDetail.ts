// ⭐ 기업 상세 데이터 소스 경계 (검색의 searchMock에 대응)
// 실제 전환 시 이 함수 내부만 GET /api/companies/{id}/detail 호출로 교체.
// 반환 형태(CompanyDetail)는 동일하게 유지한다.
//
// 데이터 소스: 7개 목 기업은 OBSERVATIONS 사용, 그 외(BULK 40개 등)는 결정적 합성.
import type { Category, CompanyDetail, CompanyItem, IndicatorItem, IndicatorSeries, SourceCode, ViewerPlan } from "@/types";
import { COMPANIES } from "./companies";
import { INDICATORS } from "./indicators";
import { OBSERVATIONS, YEARS } from "./observations";
import { BULK_COMPANIES } from "./bulkData";
import { SOURCES } from "./sources";
import { tierOf, canAccess } from "./access";

const CATEGORIES: Category[] = ["E", "S", "G"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const BOOLEAN_UNITS = new Set(["도입여부", "설치여부"]);
const SYNTH_SOURCE: Record<Category, SourceCode> = { E: "ENV", S: "DART", G: "DART" };

// 합성 기업의 (지표×연도) 값 — 결정적
function synthValue(companyId: string, ind: IndicatorItem, yearIdx: number): number | null {
  const seed = hash(`${companyId}|${ind.id}|${yearIdx}`);
  if (seed % 9 === 0) return null; // ~11% 비공개
  if (BOOLEAN_UNITS.has(ind.unit ?? "")) return seed % 3 === 0 ? null : 1;
  if (ind.unit === "%") return Number((5 + (seed % 700) / 10).toFixed(1));
  const base = 100 + (seed % 90000);
  return Math.round(base * (1 + yearIdx * 0.02));
}

/**
 * @param companyId  종목코드
 * @param plan       조회자 플랜. tier(출처+다개년) 대비 접근 불가 시 잠금.
 */
export function getCompanyDetail(companyId: string, plan: ViewerPlan = "member"): CompanyDetail | null {
  const real = COMPANIES.find((c) => c.id === companyId);
  const bulk = BULK_COMPANIES.find((c) => c.id === companyId);
  if (!real && !bulk) return null;

  const company: CompanyItem = real ?? { type: "company", id: bulk!.id, label: bulk!.name };
  const isReal = !!real;
  const latestYear = Math.max(...YEARS);

  const byCategory = {} as Record<Category, IndicatorSeries[]>;
  const coverage = {} as Record<Category, number>;

  for (const cat of CATEGORIES) {
    const series: IndicatorSeries[] = [];

    for (const indicator of INDICATORS.filter((i) => i.category === cat)) {
      let points;

      if (isReal) {
        const obs = OBSERVATIONS.filter(
          (o) => o.companyId === companyId && o.indicatorId === indicator.id,
        );
        if (obs.length === 0) continue; // 실데이터 미보유 → 행 제외
        points = YEARS.map((year) => {
          const o = obs.find((x) => x.fiscalYear === year);
          const sourceCode = o?.sourceCode ?? "DART";
          const tier = tierOf(sourceCode, year, latestYear);
          return {
            fiscalYear: year,
            value: o ? o.value : null,
            unit: indicator.unit,
            source: SOURCES[sourceCode],
            tier,
            locked: !canAccess(plan, tier),
          };
        });
      } else {
        // 합성 기업: 전 지표 결정적 생성
        const sourceCode = SYNTH_SOURCE[cat];
        points = YEARS.map((year, yi) => {
          const tier = tierOf(sourceCode, year, latestYear);
          return {
            fiscalYear: year,
            value: synthValue(companyId, indicator, yi),
            unit: indicator.unit,
            source: SOURCES[sourceCode],
            tier,
            locked: !canAccess(plan, tier),
          };
        });
      }

      series.push({ indicator, points });
    }

    byCategory[cat] = series;
    coverage[cat] = series.filter((s) => s.points.some((p) => p.value !== null)).length;
  }

  return { company, years: [...YEARS], byCategory, coverage };
}
