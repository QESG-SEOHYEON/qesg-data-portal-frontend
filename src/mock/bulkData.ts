// ⭐ 대량 조회 데이터 경계 (기업회원 — 조건검색 → 다수 기업 일괄)
// 실제 전환 시 getBulkData() 내부만 POST /api/data/bulk 로 교체.
// 라벨/단위/지표는 실제 catalogData(119개) 사용, 셀 값은 결정적 목 생성.
import type { Category, SourceCode } from "@/types";
import { CATALOG_RAW } from "./catalogData";
import type { CatalogRaw } from "./catalogData";
import { COMPANIES } from "./companies";

export const BULK_LATEST_YEAR = 2025;
export const BULK_YEARS = [2022, 2023, 2024, 2025];

export const SECTORS = [
  "반도체",
  "화학",
  "자동차",
  "2차전지",
  "바이오·제약",
  "금융",
  "유통",
  "철강·금속",
  "건설",
  "IT서비스",
  "통신",
  "식품",
] as const;

export interface BulkCompany {
  id: string; // 종목코드
  name: string;
  sector: string;
}

// 실제 7개 + 합성 33개 ≈ 40개 (대량 느낌)
const SYNTHETIC: [string, string, string][] = [
  ["035420", "NAVER", "IT서비스"],
  ["035720", "카카오", "IT서비스"],
  ["005490", "POSCO홀딩스", "철강·금속"],
  ["105560", "KB금융", "금융"],
  ["055550", "신한지주", "금융"],
  ["086790", "하나금융지주", "금융"],
  ["000270", "기아", "자동차"],
  ["012330", "현대모비스", "자동차"],
  ["207940", "삼성바이오로직스", "바이오·제약"],
  ["068270", "셀트리온", "바이오·제약"],
  ["028260", "삼성물산", "건설"],
  ["010130", "고려아연", "철강·금속"],
  ["011200", "HMM", "유통"],
  ["009150", "삼성전기", "반도체"],
  ["066570", "LG전자", "IT서비스"],
  ["003550", "LG", "금융"],
  ["017670", "SK텔레콤", "통신"],
  ["030200", "KT", "통신"],
  ["015760", "한국전력", "통신"],
  ["096770", "SK이노베이션", "화학"],
  ["051900", "LG생활건강", "화학"],
  ["097950", "CJ제일제당", "식품"],
  ["271560", "오리온", "식품"],
  ["000080", "하이트진로", "식품"],
  ["006800", "미래에셋증권", "금융"],
  ["316140", "우리금융지주", "금융"],
  ["302440", "SK바이오사이언스", "바이오·제약"],
  ["247540", "에코프로비엠", "2차전지"],
  ["373220", "LG에너지솔루션", "2차전지"],
  ["006400", "삼성SDI", "2차전지"],
  ["009830", "한화솔루션", "화학"],
  ["011170", "롯데케미칼", "화학"],
  ["004020", "현대제철", "철강·금속"],
];

export const BULK_COMPANIES: BulkCompany[] = [
  // 기존 목 기업에 업종 부여
  { id: "005930", name: "삼성전자", sector: "반도체" },
  { id: "000660", name: "SK하이닉스", sector: "반도체" },
  { id: "051910", name: "LG화학", sector: "화학" },
  { id: "005380", name: "현대자동차", sector: "자동차" },
  ...COMPANIES.filter(
    (c) => !["005930", "000660", "051910", "005380", "006400"].includes(c.id),
  ).map((c) => ({ id: c.id, name: c.label, sector: "유통" })),
  ...SYNTHETIC.map(([id, name, sector]) => ({ id, name, sector })),
];

// 지표별 대표 출처 (카탈로그 메타와 동일 규칙 간소화)
function sourceFor(item: CatalogRaw, seed: number): SourceCode {
  if (item.measure === "yn") return "DART";
  if (item.category === "E") return seed % 2 ? "ENV" : "NGMS";
  if (item.category === "S") return seed % 3 === 0 ? "SR" : "DART";
  return seed % 4 === 0 ? "NICE" : "DART";
}

function seed2(a: string, b: string): number {
  let s = 0;
  const str = a + "|" + b;
  for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
  return s;
}

export interface BulkCell {
  value: number | null; // null = 비공개
  display: string;
  sourceCode: SourceCode;
}

// 셀 값 결정적 생성 (companyId × indicatorCode × 회계연도)
export function getBulkCell(
  companyId: string,
  item: CatalogRaw,
  year: number = BULK_LATEST_YEAR,
): BulkCell {
  const seed = seed2(companyId, `${item.code}|${year}`);
  const source = sourceFor(item, seed);

  // 10% 비공개(NULL)
  if (seed % 10 === 0) return { value: null, display: "비공개", sourceCode: source };

  if (item.measure === "yn") {
    const yes = seed % 3 !== 0; // ~67% 도입
    return { value: yes ? 1 : 0, display: yes ? "도입" : "비공개", sourceCode: source };
  }
  if (item.measure === "percent") {
    const v = Number((5 + (seed % 700) / 10).toFixed(1)); // 5~75%
    return { value: v, display: `${v}%`, sourceCode: source };
  }
  // num / detail
  const base = 100 + (seed % 90000);
  return { value: base, display: base.toLocaleString("ko-KR"), sourceCode: source };
}

export interface BulkFilter {
  categories: Category[]; // 표시할 지표 카테고리
  sector?: string; // 업종 필터 (rows)
  companyIds?: string[]; // 포트폴리오 일괄 입력 (지정 시 우선)
}

export interface BulkData {
  companies: BulkCompany[];
  indicators: CatalogRaw[];
}

export function getBulkData(filter: BulkFilter): BulkData {
  let companies = BULK_COMPANIES;
  if (filter.companyIds && filter.companyIds.length > 0) {
    const set = new Set(filter.companyIds);
    companies = BULK_COMPANIES.filter((c) => set.has(c.id));
  } else if (filter.sector) {
    companies = BULK_COMPANIES.filter((c) => c.sector === filter.sector);
  }

  const cats = filter.categories.length > 0 ? filter.categories : (["E", "S", "G"] as Category[]);
  const indicators = CATALOG_RAW.filter((i) => cats.includes(i.category));

  return { companies, indicators };
}
