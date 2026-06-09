// ⭐ 조건 검색 데이터 경계 (GET /api/indicator-search 대체 예정)
// 컬럼(지표)마다 type(numeric/boolean/text)로 셀 렌더 분기. 기업×지표 대량 조회.
import type { Category, SourceCode } from "@/types";
import { BULK_COMPANIES } from "./bulkData";

export type CellType = "numeric" | "boolean" | "text";
export type BoolState = "adopted" | "not_adopted" | "undisclosed";

export interface IndicatorColumn {
  id: string;
  label: string;
  unit?: string;
  category: Category;
  type: CellType;
  source: SourceCode;
}

export interface Cell {
  value: number | null | BoolState | { disclosed: boolean; url?: string };
  source: SourceCode;
  year: number;
}
export interface IndicatorRow {
  id: string;
  name: string;
  sector: string;
  cells: Record<string, Cell>;
}

const COLUMNS: IndicatorColumn[] = [
  // E
  { id: "ghg_s1", label: "온실가스 배출량 (Scope 1)", unit: "tCO₂eq", category: "E", type: "numeric", source: "ENV" },
  { id: "ghg_s2", label: "온실가스 배출량 (Scope 2)", unit: "tCO₂eq", category: "E", type: "numeric", source: "NGMS" },
  { id: "renewable", label: "재생에너지 사용 비율", unit: "%", category: "E", type: "numeric", source: "SR" },
  { id: "carbon_neutral", label: "탄소중립 목표 선언", category: "E", type: "boolean", source: "DART" },
  { id: "iso14001", label: "환경경영(ISO14001)", category: "E", type: "boolean", source: "DART" },
  { id: "climate_risk", label: "기후리스크 관리체계", category: "E", type: "text", source: "SR" },
  // S
  { id: "female_exec", label: "여성 임원 비율", unit: "%", category: "S", type: "numeric", source: "DART" },
  { id: "injury", label: "재해율", unit: "%", category: "S", type: "numeric", source: "NGMS" },
  { id: "union", label: "노동조합 설립", category: "S", type: "boolean", source: "DART" },
  { id: "iso45001", label: "안전보건(ISO45001)", category: "S", type: "boolean", source: "DART" },
  { id: "human_rights", label: "인권정책 공시", category: "S", type: "text", source: "SR" },
  // G
  { id: "evote", label: "전자투표제", category: "G", type: "boolean", source: "DART" },
  { id: "cumvote", label: "집중투표제", category: "G", type: "boolean", source: "DART" },
  { id: "audit_comm", label: "감사위원회 설치", category: "G", type: "boolean", source: "DART" },
  { id: "outside_dir", label: "사외이사 비율", unit: "%", category: "G", type: "numeric", source: "DART" },
  { id: "shareholder_return", label: "주주환원 정책 공시", category: "G", type: "text", source: "DART" },
];

// 기본 노출 컬럼 (나머지는 ColumnPicker로 추가)
export const DEFAULT_COLUMN_IDS = ["ghg_s1", "renewable", "carbon_neutral", "female_exec", "evote"];

export function getIndicatorColumns(): IndicatorColumn[] {
  return COLUMNS;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function genCell(companyId: string, col: IndicatorColumn): Cell {
  const seed = hash(`${companyId}|${col.id}`);
  const base: Omit<Cell, "value"> = { source: col.source, year: 2024 };
  if (col.type === "numeric") {
    if (seed % 8 === 0) return { ...base, value: null }; // 비공개
    const v =
      col.unit === "%"
        ? Number((5 + (seed % 700) / 10).toFixed(1))
        : col.unit === "tCO₂eq"
          ? 1000 + (seed % 890000)
          : 100 + (seed % 9000);
    return { ...base, value: v };
  }
  if (col.type === "boolean") {
    const r = seed % 100;
    const state: BoolState = r < 55 ? "adopted" : r < 82 ? "not_adopted" : "undisclosed";
    return { ...base, value: state };
  }
  // text
  const disclosed = seed % 100 < 70;
  return { ...base, value: { disclosed, url: disclosed ? `https://example.com/d/${companyId}/${col.id}` : undefined } };
}

export interface RowFilter {
  sector?: string;
  companyIds?: string[];
}
export function getIndicatorRows(filter: RowFilter = {}): IndicatorRow[] {
  let companies = BULK_COMPANIES;
  if (filter.companyIds && filter.companyIds.length > 0) {
    const set = new Set(filter.companyIds);
    companies = BULK_COMPANIES.filter((c) => set.has(c.id));
  } else if (filter.sector) {
    companies = BULK_COMPANIES.filter((c) => c.sector === filter.sector);
  }
  return companies.map((c) => {
    const cells: Record<string, Cell> = {};
    for (const col of COLUMNS) cells[col.id] = genCell(c.id, col);
    return { id: c.id, name: c.name, sector: c.sector, cells };
  });
}

export const FREE_ROW_LIMIT = 10; // 비로그인/개인 노출 행 수
export const ENTERPRISE_ONLY = ["excel", "api", "bulk_portfolio"];

// 검색 전 키워드 바로가기 (중립 단어/지표명 — 클릭 시 그 키워드로 검색 실행)
// term = 실제 검색어(searchMock 매칭용), label = 표시용. 평가·순위 표현 금지.
export interface KeywordChip {
  label: string;
  term: string;
}
export const KEYWORD_EXAMPLES: KeywordChip[] = [
  { label: "삼성전자", term: "삼성" },
  { label: "온실가스 배출량", term: "온실가스" },
  { label: "전자투표제", term: "전자투표" },
  { label: "여성 임직원 비율", term: "여성" },
];
// 카테고리별 주요 지표 바로가기 칩
export const CATEGORY_KEYWORDS: Record<Category, KeywordChip[]> = {
  E: [
    { label: "온실가스", term: "온실가스" },
    { label: "에너지", term: "에너지" },
    { label: "용수", term: "용수" },
  ],
  S: [
    { label: "여성 비율", term: "여성" },
    { label: "재해율", term: "재해" },
    { label: "교육시간", term: "교육" },
  ],
  G: [
    { label: "전자투표제", term: "전자투표" },
    { label: "이사회", term: "이사회" },
    { label: "감사위원회", term: "감사" },
  ],
};
