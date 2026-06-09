// ⭐ 기업 상세 데이터 경계 — 개정 명세 (다타입 테이블 + 출처별 신뢰)
// 모든 값 결정적 생성. 잠금은 플랜(access.ts tier) 기준. 평가·등급·전망 없음.
import type { Category, SourceCode, SourceDef, ViewerPlan } from "@/types";
import { BULK_COMPANIES } from "./bulkData";
import { YEARS } from "./observations";
import { SOURCES } from "./sources";
import { tierOf, canAccess } from "./access";

const CATEGORIES: Category[] = ["E", "S", "G"];

export type IndType = "numeric" | "boolean" | "text";
export type BoolState = "adopted" | "not_adopted" | "undisclosed";

export interface DetailIndicator {
  label: string;
  type: IndType;
  unit?: string;
  value: number | null; // numeric (null=미공개)
  yoy: string | null; // numeric
  state?: BoolState; // boolean
  disclosed?: boolean; // text
  url?: string; // text
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
}

// 다타입 지표 정의 — 화면엔 타입 소제목 없음, 셀 모양만 분기
type Def = { cat: Category; label: string; type: IndType; unit?: string; source: SourceCode };
const DETAIL_INDICATORS: Def[] = [
  // E
  { cat: "E", label: "온실가스 배출량 (Scope 1)", type: "numeric", unit: "tCO₂eq", source: "ENV" },
  { cat: "E", label: "온실가스 배출량 (Scope 2)", type: "numeric", unit: "tCO₂eq", source: "NGMS" },
  { cat: "E", label: "재생에너지 사용 비율", type: "numeric", unit: "%", source: "SR" },
  { cat: "E", label: "용수 재이용률", type: "numeric", unit: "%", source: "SR" },
  { cat: "E", label: "에너지 사용량", type: "numeric", unit: "TJ", source: "ENV" },
  { cat: "E", label: "폐기물 재활용률", type: "numeric", unit: "%", source: "ENV" },
  { cat: "E", label: "탄소중립 목표 선언", type: "boolean", source: "DART" },
  { cat: "E", label: "RE100 가입", type: "boolean", source: "SR" },
  { cat: "E", label: "환경경영시스템(ISO14001)", type: "boolean", source: "DART" },
  { cat: "E", label: "기후리스크 관리체계", type: "text", source: "SR" },
  { cat: "E", label: "생물다양성 보호 정책", type: "text", source: "SR" },
  // S
  { cat: "S", label: "여성 임원 비율", type: "numeric", unit: "%", source: "DART" },
  { cat: "S", label: "재해율", type: "numeric", unit: "%", source: "NGMS" },
  { cat: "S", label: "1인당 교육시간", type: "numeric", unit: "시간", source: "SR" },
  { cat: "S", label: "이직률", type: "numeric", unit: "%", source: "SR" },
  { cat: "S", label: "노동조합 설립", type: "boolean", source: "DART" },
  { cat: "S", label: "협력사 행동규범", type: "boolean", source: "SR" },
  { cat: "S", label: "안전보건경영시스템(ISO45001)", type: "boolean", source: "DART" },
  { cat: "S", label: "인권정책 공시", type: "text", source: "SR" },
  { cat: "S", label: "정보보호 정책", type: "text", source: "DART" },
  // G
  { cat: "G", label: "전자투표제 도입", type: "boolean", source: "DART" },
  { cat: "G", label: "집중투표제 도입", type: "boolean", source: "DART" },
  { cat: "G", label: "감사위원회 설치", type: "boolean", source: "DART" },
  { cat: "G", label: "ESG위원회 설치", type: "boolean", source: "SR" },
  { cat: "G", label: "사외이사 비율", type: "numeric", unit: "%", source: "DART" },
  { cat: "G", label: "이사회 개최 횟수", type: "numeric", unit: "회", source: "DART" },
  { cat: "G", label: "최대주주 지분율", type: "numeric", unit: "%", source: "DART" },
  { cat: "G", label: "주주환원 정책 공시", type: "text", source: "DART" },
];

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

export function getCompanyDetail(companyId: string, plan: ViewerPlan = "member"): CompanyDetail | null {
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
    const seed = hash(`${companyId}|${def.label}`);
    const source = SOURCES[def.source];
    const tier = tierOf(def.source, latestYear, latestYear);
    const locked = !canAccess(plan, tier);
    const row: DetailIndicator = {
      label: def.label,
      type: def.type,
      unit: def.unit,
      value: null,
      yoy: null,
      source,
      year: latestYear,
      locked,
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
        trend[def.label] = { label: def.label, unit: def.unit, source, series };
      }
    } else if (def.type === "boolean") {
      const r = seed % 100;
      row.state = r < 60 ? "adopted" : r < 85 ? "not_adopted" : "undisclosed";
    } else {
      row.disclosed = seed % 100 < 75;
      if (row.disclosed) row.url = `https://example.com/disclosure/${companyId}/${seed % 1000}`;
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
  };
}

// AI 질의 예시
export const COMPANY_AI_EXAMPLES = [
  "5개년 온실가스 배출량 추이",
  "여성 임원 비율 추이",
  "재생에너지 목표를 공시했어?",
];
