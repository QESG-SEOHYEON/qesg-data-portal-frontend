// QESG 데이터 포털 — 공통 타입
//
// 기획안 원칙: 내부 식별자(id, 지표 내부코드)는 데이터 객체엔 존재하지만
// 화면에는 절대 노출하지 않는다. 화면에는 label(사람이 읽는 라벨)만 쓴다.

export type Category = "E" | "S" | "G";

export type SearchScope = "all" | "company" | "indicator";

// ── 과금/권한 경계 (기획안 5.2 출처 기준 + 단일 권한 레이어) ──
/** 데이터 포인트 1건의 과금 티어. 출처+다개년 규칙으로 결정(데이터 속성) */
export type Tier = "free" | "basic" | "enterprise";
/** 조회자 플랜. 접근 가능한 tier 집합을 결정 */
export type ViewerPlan = "guest" | "member" | "enterprise";

export interface IndicatorItem {
  type: "indicator";
  /** 내부코드 — 화면 비노출, 식별/라우팅용으로만 */
  id: string;
  /** 화면 표시용 라벨 */
  label: string;
  category: Category;
  /** 단위 (화면 표시용, 예: "tCO2eq", "%") */
  unit?: string;
  /** 검색 별칭(동의어). 화면 비노출, 검색 매칭용 */
  aliases: string[];
}

export interface CompanyItem {
  type: "company";
  /** 종목코드 — 보조 라벨로는 노출 가능(내부 지표코드와 달리 공개 식별자) */
  id: string;
  label: string;
}

export type SearchResultItem = CompanyItem | IndicatorItem;

export interface SearchResult {
  companies: CompanyItem[];
  indicators: IndicatorItem[];
}

// ── 기업 상세 / observation 모델 (기획안 7.2 타깃 스키마와 1:1 매핑) ──
// company / indicator / observation / source 4개 코어.
// 추후 백엔드 전환 시 getCompanyDetail() 내부만 API 호출로 교체.

/** 출처 코드 — 기획안 데이터 출처 5종 */
export type SourceCode = "DART" | "SR" | "NGMS" | "ENV" | "NICE";

export interface SourceDef {
  code: SourceCode;
  /** 사람이 읽는 출처명 */
  label: string;
  /** 원문 링크(목업: 자리표시). AI 어시스턴트·근거 링크에서 재사용 */
  url?: string;
}

/**
 * 관측값 1건 = 기업 × 지표 × 연도 × 출처 × 값.
 * 기획안 데이터 정책: 0값은 비공개(NULL)로 취급 → value=null.
 */
export interface Observation {
  companyId: string;
  indicatorId: string;
  fiscalYear: number;
  sourceCode: SourceCode;
  /** null = 비공개(미공시). 기획안 "0값=NULL" 정책 */
  value: number | null;
  unit?: string;
}

/** 화면 조립용: 한 지표의 연도별 시계열 1행 */
export interface SeriesPoint {
  fiscalYear: number;
  value: number | null;
  unit?: string;
  source: SourceDef;
  /** 이 데이터 포인트의 과금 티어 (출처+다개년 규칙으로 산정) */
  tier: Tier;
  /** 권한 잠금 — tier vs 조회자 플랜 판정 결과. 값은 가리되 출처·연도 뱃지는 유지(기획안 4.2) */
  locked: boolean;
}

export interface IndicatorSeries {
  indicator: IndicatorItem;
  points: SeriesPoint[];
}

/** 기업 상세 화면 1개 분량의 조립된 데이터 */
export interface CompanyDetail {
  company: CompanyItem;
  /** 화면에 노출할 연도 축(오름차순) */
  years: number[];
  /** 카테고리별 지표 시계열 */
  byCategory: Record<Category, IndicatorSeries[]>;
  /** 탭 커버리지 뱃지용 — 데이터 보유 지표 수 */
  coverage: Record<Category, number>;
}
