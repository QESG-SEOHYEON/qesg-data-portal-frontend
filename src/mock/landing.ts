// ⭐ 랜딩(비로그인 메인) 데이터 소스 경계 (랜딩 명세 3장)
// 모든 목 값은 임시 — 데이터팀이 실수치로 교체한다. 응답 형태(키 구조)는 유지.
// 실제 전환 시 각 함수 내부만 API 호출로 교체한다.
import type { Category, SourceCode } from "@/types";
import { CATALOG_RAW } from "./catalogData";
import type { CatalogRaw } from "./catalogData";

export interface CoverageStats {
  companies: string;
  indicators: number;
  sources: number;
  years: string;
}

export interface RecentUpdate {
  source: string;
  target: string;
  count: number;
  when: string;
}

export interface SourceOverviewItem {
  source: string;
  companies: number;
}

export interface CatalogItem {
  label: string;
  category: Category;
  /** 출처 라벨(명세 표기 그대로) — 표시 시 SourceCode로 매핑 */
  sources: string[];
  years: string;
  coverage: string;
}

// 축①: 커버리지 — GET /api/stats/coverage
// indicators 수는 실제 카탈로그(119개)에 연동 — 화면 통계와 카탈로그가 어긋나지 않게.
export function getCoverageStats(): CoverageStats {
  return { companies: "2,800+", indicators: CATALOG_RAW.length, sources: 5, years: "2021~2024" };
}

// 축②: 신선도 — GET /api/updates/recent
export function getRecentUpdates(): RecentUpdate[] {
  return [
    { source: "DART", target: "2024 사업보고서 반영", count: 1240, when: "2일 전" },
    { source: "SR", target: "지속가능경영보고서 파싱 추가", count: 86, when: "5일 전" },
    { source: "환경정보공개시스템", target: "갱신", count: 320, when: "1주 전" },
  ];
}

// 최종 갱신일 — GET /api/updates/recent 의 메타 (명세 2.3 우상단 표기용)
export const DATA_LAST_UPDATED = "2026-06-04";

// 축③: 출처·신뢰성 — GET /api/stats/sources
export function getSourceOverview(): SourceOverviewItem[] {
  return [
    { source: "DART 사업보고서", companies: 2800 },
    { source: "SR(지속가능경영보고서)", companies: 1140 },
    { source: "NGMS", companies: 2410 },
    { source: "환경정보공개시스템", companies: 1950 },
    { source: "NICE", companies: 2600 },
  ];
}

// 축① 구체화: 보유 지표 카탈로그 — GET /api/indicators/catalog
// 라벨/카테고리/단위는 실제 DB(119개), 출처·연도·커버리지 메타는 목(결정적 생성).
// 실제 전환 시 메타는 백엔드 집계값으로 교체(라벨은 그대로).
function seedOf(code: string): number {
  let s = 0;
  for (let i = 0; i < code.length; i++) s = (s * 31 + code.charCodeAt(i)) >>> 0;
  return s;
}

function mockSources(item: CatalogRaw, seed: number): string[] {
  if (item.measure === "yn") return ["DART"]; // 공시 여부 → 사업보고서
  if (item.category === "E") {
    if (/배출|에너지|온실|용수|폐기물/.test(item.name)) {
      return seed % 2 ? ["환경정보공개", "NGMS"] : ["DART", "NGMS"];
    }
    return ["환경정보공개"];
  }
  if (item.category === "S") return seed % 3 === 0 ? ["DART", "SR"] : ["DART"];
  return seed % 4 === 0 ? ["DART", "NICE"] : ["DART"]; // G
}

export function getCatalog(): CatalogItem[] {
  return CATALOG_RAW.map((item) => {
    const seed = seedOf(item.code);
    const coverageNum = 800 + (seed % 2000); // 800~2,799사
    return {
      label: item.name,
      category: item.category,
      sources: mockSources(item, seed),
      years: seed % 3 === 0 ? "2022~2024" : "2021~2024",
      coverage: `${(Math.round(coverageNum / 10) * 10).toLocaleString("ko-KR")}사`,
    };
  });
}

// 비로그인 노출 범위(맛보기) — 그룹(E/S/G)당 마퀴에 흐르는 지표 수. 나머지는 "더 보기 → 로그인".
// 조정 가능하게 상수로 분리.
export const CATALOG_PREVIEW_PER_CATEGORY = 8;

// 카탈로그 출처 라벨(명세 표기) → 내부 SourceCode 매핑 (뱃지 색 재사용용)
export function toSourceCode(label: string): SourceCode {
  if (label.startsWith("환경")) return "ENV";
  if (label === "SR") return "SR";
  if (label === "NGMS") return "NGMS";
  if (label === "NICE") return "NICE";
  return "DART";
}
