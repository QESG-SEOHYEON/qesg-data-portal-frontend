// ⭐ 기업 상세 데이터 경계 — 개정 명세 (다타입 테이블 + 출처별 신뢰)
// 모든 값 결정적 생성. 잠금은 화면단 등급 규칙(accessRules: VISIBLE_COUNT)에서 단일 처리.
import type { Category, SourceCode, SourceDef, ViewerPlan } from "@/types";
import { BULK_COMPANIES } from "./bulkData";
import { YEARS } from "./observations";
import { SOURCES } from "./sources";
import { GROUPED_INDICATORS } from "./indicatorGrouping";
import type { GroupedIndicator } from "./indicatorGrouping";
import { getIndicatorColumns } from "./indicatorSearch";
import type { SubDef } from "./indicatorSearch";

// 코드 → sub컬럼 정의 (그리드와 동일: E3_1 Scope, E4 이니셔티브 등)
const CODE_SUBS: Record<string, SubDef[]> = Object.fromEntries(
  getIndicatorColumns()
    .filter((c) => c.subs && c.subs.length)
    .map((c) => [c.id, c.subs as SubDef[]]),
);

const CATEGORIES: Category[] = ["E", "S", "G"];

export type IndType = "numeric" | "boolean" | "text";
export type BoolState = "adopted" | "not_adopted" | "undisclosed";

export interface SubCell {
  code: string;
  name: string;
  value?: number | null; // numeric sub
  state?: BoolState; // boolean sub
}
export interface DetailIndicator {
  code: string; // = 분류 코드 (그리드와 동일 체계)
  label: string;
  type: IndType;
  unit?: string;
  value: number | null; // numeric (null=미공개)
  yoy: string | null; // numeric
  state?: BoolState; // boolean
  disclosed?: boolean; // text
  url?: string; // text
  subs?: SubCell[]; // sub컬럼 있는 지표(예: Scope1/2/3, 이니셔티브별)
  source: SourceDef;
  year: number;
  locked: boolean;
}
export interface TrendData {
  label: string;
  unit?: string;
  source: SourceDef;
  series: { year: number; value: number }[];
}
export interface TrustSource {
  source: string;
  year: number;
  trust: string[];
  url: string;
}
export interface CompanyDetail {
  id: string;
  name: string;
  industry: string;
  market: string;
  size: string;
  fiscalMonth: string;
  baseYear: number;
  trustSources: TrustSource[];
  coverage: Record<Category, number>;
  indicators: Record<Category, DetailIndicator[]>;
  trend: Record<string, TrendData>;
  disclosures: { title: string; meta: string; url: string }[];
  similar: { id: string; name: string }[];
  // 기업 정보(NICE c_nice_company_info 기반) — 규모/재무 맥락.
  // level: basic=회원 열람, financial=개인 플랜+ 열람(비회원은 전체 잠금). 급여 등 민감정보 제외.
  businessMeta: { label: string; value: string; level: "basic" | "financial" }[];
}

// 다타입 지표 정의 — 그리드와 동일한 분류 코드 체계(GROUPED_INDICATORS 노출)에서 파생
type Def = { cat: Category; code: string; label: string; type: IndType; unit?: string; source: SourceCode };
// 출처(데이터 유지용, 화면 비노출) — 일부 수치형은 가공출처(SR)로 두어 잠금 데모 유지
function srcOf(g: GroupedIndicator): SourceCode {
  if (g.type !== "numeric") return "DART";
  if (hash(g.code) % 3 === 0) return "SR";
  return g.category === "E" ? "ENV" : g.category === "S" ? "NGMS" : "DART";
}
const DETAIL_INDICATORS: Def[] = GROUPED_INDICATORS.filter((g) => g.kind === "expose").map((g) => ({
  cat: g.category,
  code: g.code,
  label: g.name,
  type: g.type,
  unit: g.unit,
  source: srcOf(g),
}));

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function refValue(seed: number, unit?: string): number {
  if (unit === "%") return 5 + (seed % 700) / 10;
  if (unit === "TJ") return 1000 + (seed % 89000);
  if (unit === "tCO₂eq") return 10000 + (seed % 890000);
  if (unit === "시간") return 10 + (seed % 60);
  if (unit === "회") return 4 + (seed % 12);
  return 100 + (seed % 9000);
}

function genSeries(seed: number, unit?: string): { year: number; value: number }[] {
  const isPct = unit === "%";
  const ref = refValue(seed, unit);
  return YEARS.map((y, yi) => {
    const j = ((seed >>> (yi + 2)) % 20) / 100;
    const raw = ref * (0.85 + yi * 0.05 + j);
    return { year: y, value: isPct ? Number(raw.toFixed(1)) : Math.round(raw) };
  });
}

function fmtYoY(base: number, prev: number, isPct: boolean): string {
  const diff = isPct ? base - prev : ((base - prev) / prev) * 100;
  const sign = diff >= 0 ? "+" : "-";
  return `${sign}${Math.abs(diff).toFixed(1)}${isPct ? "%p" : "%"}`;
}

// 검색 결과 기업 카드용 경량 메타 (업종·시장·규모·SR 발간 여부) — 결정적 생성
const SECTOR_POOL = [
  "전기·전자", "화학", "자동차", "2차전지", "바이오·제약", "금융",
  "유통", "철강·금속", "건설", "IT·서비스", "통신", "식품",
];
export interface CompanyCardMeta {
  sector: string;
  market: string;
  size: string;
  srPublished: boolean; // 지속가능경영보고서 발간 여부 (사실 정보, 미발간은 칩 없음)
}
export function getCompanyCardMeta(companyId: string): CompanyCardMeta {
  const bulk = BULK_COMPANIES.find((c) => c.id === companyId);
  const h = hash(companyId);
  return {
    sector: bulk?.sector ?? SECTOR_POOL[h % SECTOR_POOL.length],
    market: h % 3 === 0 ? "코스닥" : "코스피",
    size: h % 4 === 0 ? "중견기업" : "대기업",
    srPublished: h % 4 !== 0,
  };
}

export function getCompanyDetail(companyId: string, _plan: ViewerPlan = "member"): CompanyDetail | null {
  const bulk = BULK_COMPANIES.find((c) => c.id === companyId);
  if (!bulk) return null;
  const latestYear = Math.max(...YEARS);
  const h = hash(companyId);

  const indicators = {} as Record<Category, DetailIndicator[]>;
  const trend: Record<string, TrendData> = {};
  const coverage = {} as Record<Category, number>;

  for (const cat of CATEGORIES) {
    indicators[cat] = [];
  }

  for (const def of DETAIL_INDICATORS) {
    const seed = hash(`${companyId}|${def.code}`);
    const source = SOURCES[def.source];
    const row: DetailIndicator = {
      code: def.code,
      label: def.label,
      type: def.type,
      unit: def.unit,
      value: null,
      yoy: null,
      source,
      year: latestYear,
      locked: false, // 등급 잠금은 EsgIndicatorTable에서 accessRules로 단일 처리
    };

    if (def.type === "numeric") {
      if (seed % 9 === 0) {
        row.value = null; // 미공개
      } else {
        const series = genSeries(seed, def.unit);
        const base = series[series.length - 1].value;
        const prev = series[series.length - 2].value;
        row.value = base;
        row.yoy = prev !== 0 ? fmtYoY(base, prev, def.unit === "%") : null;
        trend[def.code] = { label: def.label, unit: def.unit, source, series };
      }
    } else if (def.type === "boolean") {
      const r = seed % 100;
      row.state = r < 60 ? "adopted" : r < 85 ? "not_adopted" : "undisclosed";
    } else {
      row.disclosed = seed % 100 < 75;
      if (row.disclosed) row.url = `https://example.com/disclosure/${companyId}/${seed % 1000}`;
    }

    // sub컬럼 있는 지표: sub별 값 생성 (펼침 상세에서 표시)
    const subs = CODE_SUBS[def.code];
    if (subs && subs.length) {
      row.subs = subs.map((s) => {
        const ss = hash(`${companyId}|${def.code}|${s.code}`);
        if (def.type === "numeric") {
          return { code: s.code, name: s.name, value: ss % 9 === 0 ? null : Math.round(refValue(ss, def.unit)) };
        }
        if (def.type === "boolean") {
          const r = ss % 100;
          return { code: s.code, name: s.name, state: r < 60 ? "adopted" : r < 85 ? "not_adopted" : "undisclosed" };
        }
        return { code: s.code, name: s.name };
      });
    }
    indicators[def.cat].push(row);
  }

  for (const cat of CATEGORIES) {
    coverage[cat] = indicators[cat].filter((i) =>
      i.type === "numeric" ? i.value !== null : i.type === "boolean" ? i.state !== "undisclosed" : i.disclosed,
    ).length;
  }

  // 출처별 신뢰 블록
  const verified = h % 3 !== 0;
  const trustSources: TrustSource[] = [
    {
      source: "지속가능경영보고서",
      year: latestYear,
      trust: verified ? ["GRI", "SASB", "TCFD", "제3자 검증 완료"] : ["GRI", "TCFD"],
      url: `https://example.com/sr/${companyId}`,
    },
    { source: "사업보고서", year: latestYear, trust: ["법정 의무공시 (금융감독원)"], url: `https://example.com/dart/${companyId}` },
    { source: "환경정보공개", year: latestYear, trust: ["환경부 운영", "공적 데이터"], url: `https://example.com/env/${companyId}` },
  ];

  // 유사 기업 — 같은 업종 우선
  const sameSector = BULK_COMPANIES.filter((c) => c.sector === bulk.sector && c.id !== companyId);
  const others = BULK_COMPANIES.filter((c) => c.id !== companyId && c.sector !== bulk.sector);
  const similar = [...sameSector, ...others].slice(0, 4).map((c) => ({ id: c.id, name: c.name }));

  // 기업 정보 — c_nice_company_info 컬럼에 맞춰 결정적 생성(목업, 추후 NICE 연동).
  // listed/company_size/founding_date/end_month/employee/revenue_consol/market_cap/total_assets_consol
  const listed = h % 3 === 0 ? "코스닥" : "코스피";
  const founded = 1960 + (h % 56); // 설립연도
  const age = latestYear - founded; // 업력
  const employees = 300 + (h % 19700);
  const empDate = `${latestYear}.12`;
  const revenueEok = 1000 + (h % 149000); // 매출액(연결, 억원)
  const mcapEok = 800 + ((h * 7) % 220000); // 시가총액(억원)
  const assetsEok = Math.round(revenueEok * (1 + (h % 25) / 10)); // 자산총계(연결, 억원)
  const won = (eok: number) =>
    eok >= 10000 ? `${(eok / 10000).toFixed(1)}조원` : `${eok.toLocaleString("ko-KR")}억원`;
  const businessMeta: { label: string; value: string; level: "basic" | "financial" }[] = [
    { label: "상장 여부", value: listed, level: "basic" },
    { label: "기업규모", value: bulk.sector && h % 4 === 0 ? "중견기업" : "대기업", level: "basic" },
    { label: "업력", value: `${age}년 (${founded} 설립)`, level: "basic" },
    { label: "결산월", value: "12월", level: "basic" },
    { label: "임직원 수", value: `${employees.toLocaleString("ko-KR")}명 (${empDate} 기준)`, level: "basic" },
    { label: "매출액(연결)", value: won(revenueEok), level: "financial" },
    { label: "시가총액", value: won(mcapEok), level: "financial" },
    { label: "자산총계(연결)", value: won(assetsEok), level: "financial" },
  ];

  return {
    id: companyId,
    name: bulk.name,
    industry: bulk.sector,
    market: h % 3 === 0 ? "코스닥" : "코스피",
    size: h % 4 === 0 ? "중견기업" : "대기업",
    fiscalMonth: "12월",
    baseYear: latestYear,
    trustSources,
    coverage,
    indicators,
    trend,
    disclosures: [
      { title: `지속가능경영보고서 ${latestYear}`, meta: "GRI · SASB · TCFD · 제3자 검증", url: `https://example.com/sr/${companyId}` },
      { title: `사업보고서 ${latestYear}`, meta: "DART", url: `https://example.com/dart/${companyId}` },
      { title: "환경정보 공개", meta: "환경정보공개시스템", url: `https://example.com/env/${companyId}` },
    ],
    similar,
    businessMeta,
  };
}

// AI 질의 예시
export const COMPANY_AI_EXAMPLES = [
  "5개년 온실가스 배출량 추이",
  "여성 임원 비율 추이",
  "재생에너지 목표를 공시했어?",
];
