// ⭐ 통합 검색 데이터 경계 (GET /api/indicator-search 대체 예정)
// 지표 단일 소스 = i_indicator_master(CATALOG_RAW, 119). 컬럼·검색 자동완성·바로가기를 모두 여기서 파생 → id 1:1.
// (여러 컬럼인 지표는 i_indicator_sub로 컬럼 그룹 확장 예정 — 목업은 master 1지표=1컬럼.)
// ⚠️ 출처는 화면에서 끔(데이터만 유지). DB 직접 연결 X(목업).
import type { Category, IndicatorItem, SourceCode } from "@/types";
import { CATALOG_RAW } from "./catalogData";
import type { CatalogRaw } from "./catalogData";
import { BULK_COMPANIES } from "./bulkData";

export type CellType = "numeric" | "boolean" | "text";
export type BoolState = "adopted" | "not_adopted" | "undisclosed";

// 서브지표 (i_indicator_sub) — 한 지표가 여러 셀일 때의 하위 컬럼
export interface SubDef {
  code: string;
  name: string;
  unit?: string;
}

export interface IndicatorColumn {
  id: string; // = indicator_code (master)
  label: string; // = indicator_name
  unit?: string;
  category: Category;
  type: CellType; // = value_type(measure) 기반
  source: SourceCode; // 데이터 유지용(화면 비노출)
  subs?: SubDef[]; // 있으면 sub별 컬럼으로 펼침(지표명 그룹 헤더)
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

// measure(value_type) → 셀 렌더 타입
function measureToType(m: string): CellType {
  if (m === "yn") return "boolean";
  if (m === "detail") return "text";
  return "numeric"; // num | percent
}
// 출처(데이터 유지용, 화면 비노출) — 결정적 배정
function sourceOf(c: CatalogRaw): SourceCode {
  if (c.measure === "yn" || c.measure === "detail") return "DART";
  if (c.category === "E") return "ENV";
  if (c.category === "S") return "NGMS";
  return "DART";
}

// 서브지표 목 데이터 (i_indicator_sub 발췌, 출처 변형은 합쳐 unique) — 일부 지표만 sub 보유
const SUBS: Record<string, SubDef[]> = {
  E2: [
    { code: "separate", name: "IFRS(별도)" },
    { code: "consolidated", name: "IFRS(연결)" },
  ],
  E3_1: [
    { code: "scope1", name: "Scope1" },
    { code: "scope2", name: "Scope2" },
    { code: "scope3", name: "Scope3" },
    { code: "total", name: "합계" },
  ],
  E5: [
    { code: "direct", name: "직접에너지" },
    { code: "indirect", name: "간접에너지" },
  ],
  E4: [
    { code: "cdp", name: "CDP" },
    { code: "re100", name: "RE100" },
    { code: "sbti", name: "SBTi" },
    { code: "kre100", name: "K-RE100" },
    { code: "tnfd", name: "TNFD" },
    { code: "pri", name: "PRI" },
  ],
};

// master 119 → 컬럼 (sub 있으면 부착)
const COLUMNS: IndicatorColumn[] = CATALOG_RAW.map((c) => ({
  id: c.code,
  label: c.name,
  unit: c.unit || undefined,
  category: c.category,
  type: measureToType(c.measure),
  source: sourceOf(c),
  subs: SUBS[c.code],
}));

export function getIndicatorColumns(): IndicatorColumn[] {
  return COLUMNS;
}

// 검색 자동완성용 지표 목록 (컬럼과 동일 id) — 검색·표·바로가기가 한 소스
export function getIndicatorSuggestions(): IndicatorItem[] {
  return COLUMNS.map((c) => ({
    type: "indicator",
    id: c.id,
    label: c.label,
    category: c.category,
    unit: c.unit,
    aliases: [],
  }));
}

// 기본 노출 컬럼 — 카테고리별 앞쪽 몇 개 (대량 진입 시 압도 방지)
function firstOf(cat: Category, n: number): string[] {
  return COLUMNS.filter((c) => c.category === cat).slice(0, n).map((c) => c.id);
}
export const DEFAULT_COLUMN_IDS = [...firstOf("E", 2), ...firstOf("S", 2), ...firstOf("G", 1)];

// 회계연도 (조회 가능 연도) — 기본 조회는 가장 최신 연도(공시 시차 반영, 2026 기준 FY2025)
export const SEARCH_YEARS = [2022, 2023, 2024, 2025];
export const SEARCH_LATEST_YEAR = 2025;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function genCell(companyId: string, col: IndicatorColumn, year: number, subCode?: string | null): Cell {
  const seed = hash(`${companyId}|${col.id}|${subCode ?? ""}|${year}`);
  const base: Omit<Cell, "value"> = { source: col.source, year };
  if (col.type === "numeric") {
    if (seed % 8 === 0) return { ...base, value: null }; // 비공개
    const v = col.unit === "%" ? Number((5 + (seed % 700) / 10).toFixed(1)) : 100 + (seed % 900000);
    return { ...base, value: v };
  }
  if (col.type === "boolean") {
    const r = seed % 100;
    const state: BoolState = r < 55 ? "adopted" : r < 82 ? "not_adopted" : "undisclosed";
    return { ...base, value: state };
  }
  // text(서술형)
  const disclosed = seed % 100 < 70;
  return {
    ...base,
    value: { disclosed, url: disclosed ? `https://example.com/d/${companyId}/${col.id}` : undefined },
  };
}

// 셀 키: `${컬럼id}@${연도}` (sub 있으면 `#${subCode}` 추가)
export function cellKey(colId: string, year: number, subCode?: string | null): string {
  return subCode ? `${colId}@${year}#${subCode}` : `${colId}@${year}`;
}

export interface RowFilter {
  sector?: string;
  companyIds?: string[];
  years?: number[];
}
export function getIndicatorRows(filter: RowFilter = {}): IndicatorRow[] {
  const years = filter.years && filter.years.length > 0 ? filter.years : [SEARCH_LATEST_YEAR];
  let companies = BULK_COMPANIES;
  if (filter.companyIds && filter.companyIds.length > 0) {
    const set = new Set(filter.companyIds);
    companies = BULK_COMPANIES.filter((c) => set.has(c.id));
  } else if (filter.sector) {
    companies = BULK_COMPANIES.filter((c) => c.sector === filter.sector);
  }
  return companies.map((c) => {
    const cells: Record<string, Cell> = {};
    for (const col of COLUMNS) {
      const subs = col.subs && col.subs.length ? col.subs : [null];
      for (const sub of subs)
        for (const y of years) cells[cellKey(col.id, y, sub?.code)] = genCell(c.id, col, y, sub?.code);
    }
    return { id: c.id, name: c.name, sector: c.sector, cells };
  });
}

export const FREE_ROW_LIMIT = 10; // 비로그인/개인 노출 행 수
export const ENTERPRISE_ONLY = ["excel", "api", "bulk_portfolio"];

// 검색 전 키워드 바로가기 (중립 단어/지표명 — 클릭 시 그 키워드로 검색 실행)
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
