// ⭐ 랜딩(비로그인 메인) 데이터 소스 경계 (랜딩 명세 3장)
// 모든 목 값은 임시 — 데이터팀이 실수치로 교체한다. 응답 형태(키 구조)는 유지.
// 실제 전환 시 각 함수 내부만 API 호출로 교체한다.
import type { Category, SourceCode } from "@/types";
import { CATALOG_RAW } from "./catalogData";
import type { CatalogRaw } from "./catalogData";
import { BULK_COMPANIES } from "./bulkData";

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
  return { companies: "2,800+", indicators: CATALOG_RAW.length, sources: 5, years: "2022~2025" };
}

// 축②: 신선도 — GET /api/updates/recent
export function getRecentUpdates(): RecentUpdate[] {
  return [
    { source: "DART", target: "2025 사업보고서 반영", count: 1240, when: "2일 전" },
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
      years: seed % 3 === 0 ? "2023~2025" : "2022~2025",
      coverage: `${(Math.round(coverageNum / 10) * 10).toLocaleString("ko-KR")}사`,
    };
  });
}

// 메인 바로가기 — 카테고리(E/S/G)별 "공시 커버리지가 가장 높은(=많은 기업이 공시하는)" 지표 1개.
// 중립 기준(우열 아님). 커버리지 메타는 목(결정적). 실제 전환 시 백엔드 집계로 교체.
export function getQuickIndicators(): { category: Category; label: string; code: string }[] {
  const cats: Category[] = ["E", "S", "G"];
  const coverageOf = (code: string) => 800 + (seedOf(code) % 2000); // getCatalog와 동일 규칙
  return cats.map((cat) => {
    let best: { label: string; code: string; cov: number } | null = null;
    for (const item of CATALOG_RAW) {
      if (item.category !== cat) continue;
      const cov = coverageOf(item.code);
      if (!best || cov > best.cov) best = { label: item.name, code: item.code, cov };
    }
    return { category: cat, label: best ? best.label : "", code: best ? best.code : "" };
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

// ── 집계 통계 위젯 (안전선: 집계 단위만, 평가·순위·전망 없음, 표본수 병기, 면책) ──

// 2.3 IndustryCompare — 산업별 환경 데이터 비교 (업종 평균 + 표본수)
export interface IndustryRow {
  name: string;
  value: number;
  sample: number; // 표본 기업 수 (통계 투명성)
}
export interface IndustryCompare {
  metric: string;
  unit: string;
  industries: IndustryRow[];
}

export const INDUSTRY_METRIC_OPTIONS = [
  { value: "ghg_intensity", label: "온실가스 배출 집약도" },
  { value: "energy_intensity", label: "에너지 사용 집약도" },
  { value: "water_intensity", label: "용수 사용 집약도" },
];

const INDUSTRY_DATA: Record<string, IndustryCompare> = {
  ghg_intensity: {
    metric: "온실가스 배출 집약도",
    unit: "tCO2eq / 매출 10억",
    industries: [
      { name: "철강", value: 24.1, sample: 12 },
      { name: "화학", value: 18.7, sample: 34 },
      { name: "운송", value: 15.4, sample: 18 },
      { name: "건설", value: 9.8, sample: 27 },
      { name: "전기·전자", value: 6.2, sample: 41 },
      { name: "IT·서비스", value: 2.1, sample: 53 },
    ],
  },
  energy_intensity: {
    metric: "에너지 사용 집약도",
    unit: "TJ / 매출 10억",
    industries: [
      { name: "철강", value: 3.8, sample: 12 },
      { name: "화학", value: 3.1, sample: 34 },
      { name: "운송", value: 2.4, sample: 18 },
      { name: "건설", value: 1.6, sample: 27 },
      { name: "전기·전자", value: 1.1, sample: 41 },
      { name: "IT·서비스", value: 0.4, sample: 53 },
    ],
  },
  water_intensity: {
    metric: "용수 사용 집약도",
    unit: "천 ton / 매출 10억",
    industries: [
      { name: "화학", value: 5.2, sample: 31 },
      { name: "철강", value: 4.6, sample: 11 },
      { name: "건설", value: 2.3, sample: 24 },
      { name: "운송", value: 1.5, sample: 16 },
      { name: "전기·전자", value: 1.2, sample: 38 },
      { name: "IT·서비스", value: 0.3, sample: 49 },
    ],
  },
};

export function getIndustryCompare(metric = "ghg_intensity"): IndustryCompare {
  // → GET /api/stats/industry-compare?metric={metric}
  return INDUSTRY_DATA[metric] ?? INDUSTRY_DATA.ghg_intensity;
}

// 2.4 DisclosureRate — 지표별 공시율 (순수 사실 집계. 공시 여부 ≠ 성과)
export interface DisclosureRow {
  indicator: string;
  rate: number; // %
}
export function getDisclosureRate(): DisclosureRow[] {
  // → GET /api/stats/disclosure-rate
  return [
    { indicator: "Scope 1 배출량", rate: 86 },
    { indicator: "Scope 2 배출량", rate: 84 },
    { indicator: "Scope 3 배출량", rate: 18 },
    { indicator: "여성 임원 비율", rate: 93 },
    { indicator: "재해율", rate: 71 },
    { indicator: "이사회 독립성", rate: 97 },
  ];
}

// 2.5 SectorTrend — 업종 평균 시계열 (추이만, 해석·전망 없음)
export interface SectorTrendPoint {
  year: number;
  value: number;
}
export interface SectorTrend {
  sector: string;
  metric: string;
  unit: string;
  series: SectorTrendPoint[];
}
export const SECTOR_OPTIONS = [
  { value: "manufacturing", label: "제조업" },
  { value: "chemical", label: "화학" },
  { value: "it", label: "IT·서비스" },
  { value: "finance", label: "금융" },
];
const SECTOR_DATA: Record<string, SectorTrend> = {
  manufacturing: {
    sector: "제조업",
    metric: "온실가스 배출 집약도 (업종 평균)",
    unit: "tCO2eq / 매출 10억",
    series: [
      { year: 2021, value: 16.2 },
      { year: 2022, value: 15.8 },
      { year: 2023, value: 15.1 },
      { year: 2024, value: 14.6 },
    ],
  },
  chemical: {
    sector: "화학",
    metric: "온실가스 배출 집약도 (업종 평균)",
    unit: "tCO2eq / 매출 10억",
    series: [
      { year: 2021, value: 20.4 },
      { year: 2022, value: 19.9 },
      { year: 2023, value: 19.1 },
      { year: 2024, value: 18.7 },
    ],
  },
  it: {
    sector: "IT·서비스",
    metric: "온실가스 배출 집약도 (업종 평균)",
    unit: "tCO2eq / 매출 10억",
    series: [
      { year: 2021, value: 2.6 },
      { year: 2022, value: 2.4 },
      { year: 2023, value: 2.2 },
      { year: 2024, value: 2.1 },
    ],
  },
  finance: {
    sector: "금융",
    metric: "온실가스 배출 집약도 (업종 평균)",
    unit: "tCO2eq / 매출 10억",
    series: [
      { year: 2021, value: 1.4 },
      { year: 2022, value: 1.3 },
      { year: 2023, value: 1.3 },
      { year: 2024, value: 1.2 },
    ],
  },
};
export function getSectorTrend(sector = "manufacturing"): SectorTrend {
  // → GET /api/stats/sector-trend?sector={sector}
  return SECTOR_DATA[sector] ?? SECTOR_DATA.manufacturing;
}

// 최근 지속가능경영보고서(SR) 공시 — 공시일 기준 최신순 + 원문 링크 (다운로드 X, 링크만)
export interface SrDisclosureRow {
  company: string;
  stockCode: string;
  daysAgo: number; // 공시일로부터 경과일 (최근 30일 내)
  disclosedAt: string; // YYYY-MM-DD
  url: string; // 원문(SR) 뷰어 링크 — 목업 placeholder. 파일 다운로드 아님.
}

function srHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const SR_BASE = new Date(2026, 5, 8); // 기준일 2026-06-08
function fmtDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// ESG 뉴스 (크롤링 데이터) — 테마·날짜별 + 원문 링크
export type NewsTheme = "E" | "S" | "G" | "policy";
export const NEWS_THEME_LABELS: Record<NewsTheme, string> = {
  E: "환경",
  S: "사회",
  G: "지배구조",
  policy: "정책/규제",
};
export interface EsgNewsItem {
  id: string;
  date: string; // YYYY-MM-DD
  theme: NewsTheme;
  title: string;
  body: string; // 기사 원문 발췌(요약 아님) — 카드에서 키워드 대목 발췌·하이라이트
  source: string; // 매체/기관
  companies: string[]; // 언급 기업 (없으면 빈 배열 — 정책/규제 등)
  views: number; // 조회수 (조회순 정렬용)
  url: string; // 원문 링크 (목업 placeholder)
}

const NEWS: Omit<EsgNewsItem, "url">[] = [
  {
    id: "n1",
    date: "2026-06-08",
    theme: "policy",
    title: "금융위, ESG 공시 의무화 단계 로드맵 발표",
    body: "금융위원회는 자산 2조원 이상 상장사를 시작으로 2027 사업연도부터 지속가능성 공시를 단계적으로 의무화한다고 밝혔다. 적용 대상은 2029년까지 코스피 전체 상장사로 확대되며 기후 관련 지표가 우선 적용된다.",
    source: "금융위원회",
    companies: [],
    views: 2140,
  },
  {
    id: "n2",
    date: "2026-06-08",
    theme: "E",
    title: "삼성전자, 2030 재생에너지 100% 로드맵 공개",
    body: "삼성전자가 2030년까지 국내 사업장 전력을 재생에너지로 전환하는 로드맵을 공개했다. 회사는 협력사의 탄소감축을 지원하는 펀드도 함께 조성한다고 설명했다.",
    source: "한국경제",
    companies: ["삼성전자", "삼성SDI"],
    views: 1820,
  },
  {
    id: "n3",
    date: "2026-06-07",
    theme: "G",
    title: "KB금융, 이사회 산하 ESG위원회 신설",
    body: "KB금융지주가 이사회 산하에 ESG위원회를 신설하고 사외이사 비중을 확대했다. 위원회는 지속가능경영 전략과 기후리스크를 분기마다 점검한다.",
    source: "ESG경제",
    companies: ["KB금융"],
    views: 760,
  },
  {
    id: "n4",
    date: "2026-06-06",
    theme: "S",
    title: "현대차, 협력사 동반성장 기금 확대",
    body: "현대자동차가 2차·3차 협력사의 안전보건과 노동환경 개선을 돕는 동반성장 기금을 확대한다고 밝혔다. 기금은 작업환경 개선과 안전설비 도입 자금으로 쓰인다.",
    source: "매일경제",
    companies: ["현대자동차", "현대모비스", "기아"],
    views: 1340,
  },
  {
    id: "n5",
    date: "2026-06-05",
    theme: "E",
    title: "SK이노베이션, ESS 탄소저감 신기술 발표",
    body: "SK이노베이션이 차세대 배터리 공정에서 온실가스 배출을 줄이는 기술을 공개하고 실증에 착수했다. 회사는 공정 전력의 재생에너지 비중도 단계적으로 높일 계획이다.",
    source: "전자신문",
    companies: ["SK이노베이션"],
    views: 1180,
  },
  {
    id: "n6",
    date: "2026-06-05",
    theme: "policy",
    title: "환경부, 배출권 4기 할당계획 확정",
    body: "환경부가 4차 계획기간 배출권 할당계획을 확정해 무상할당 비율을 줄이고 유상할당을 확대한다. 업종별 벤치마크 기준도 함께 조정됐다.",
    source: "환경부",
    companies: [],
    views: 990,
  },
  {
    id: "n7",
    date: "2026-06-04",
    theme: "G",
    title: "셀트리온, 전자투표제 전 계열사 확대",
    body: "셀트리온이 소액주주의 의결권 행사 편의를 위해 전자투표제를 전 계열사로 확대 적용한다. 회사는 다음 정기주주총회부터 적용한다고 밝혔다.",
    source: "서울경제",
    companies: ["셀트리온"],
    views: 540,
  },
  {
    id: "n8",
    date: "2026-06-03",
    theme: "S",
    title: "LG화학, 산업안전 ISO45001 전사 인증",
    body: "LG화학이 국내 전 사업장에서 안전보건경영시스템 국제표준인 ISO45001 인증을 획득했다고 밝혔다. 회사는 해외 사업장으로 인증을 확대할 방침이다.",
    source: "ESG경제",
    companies: ["LG화학"],
    views: 870,
  },
  {
    id: "n9",
    date: "2026-06-02",
    theme: "E",
    title: "포스코, 수소환원제철 실증 설비 착공",
    body: "포스코가 석탄 대신 수소로 철을 만드는 수소환원제철 실증 설비 건설에 들어갔다. 회사는 2030년 상용화를 목표로 단계적 투자를 이어간다.",
    source: "한국경제",
    companies: ["POSCO홀딩스", "현대제철"],
    views: 1530,
  },
  {
    id: "n10",
    date: "2026-05-30",
    theme: "G",
    title: "거래소, ESG 정보공개 가이던스 개정",
    body: "한국거래소가 기업 ESG 자율공시 항목을 표준화하는 정보공개 가이던스 개정안을 내놨다. 개정안은 기업 간 비교 가능성을 높이는 데 초점을 맞췄다.",
    source: "한국거래소",
    companies: [],
    views: 680,
  },
  {
    id: "n11",
    date: "2026-05-28",
    theme: "S",
    title: "네이버, 임직원 다양성 보고서 첫 발간",
    body: "네이버가 성별·연령 구성과 포용 정책 현황을 담은 다양성 보고서를 처음 발간했다. 회사는 관련 지표를 매년 공개하기로 했다.",
    source: "디지털데일리",
    companies: ["NAVER"],
    views: 720,
  },
  {
    id: "n12",
    date: "2026-05-27",
    theme: "policy",
    title: "공정위, 부당 내부거래 점검 강화 예고",
    body: "공정거래위원회가 대기업집단의 일감 몰아주기 등 부당 내부거래 점검을 강화한다고 예고했다. 지배구조 리스크가 큰 집단을 우선 점검 대상으로 삼는다.",
    source: "연합뉴스",
    companies: [],
    views: 610,
  },
  // 하루 2~4건 보장용 보강 기사
  {
    id: "n13",
    date: "2026-06-08",
    theme: "G",
    title: "두산에너빌리티, 이사회 ESG 평가 체계 도입",
    body: "두산에너빌리티가 이사회 활동을 ESG 관점에서 평가하는 내부 체계를 도입한다. 평가 결과를 이사 보수와 연계하는 방안도 검토 중이다.",
    source: "서울경제",
    companies: ["두산에너빌리티"],
    views: 880,
  },
  {
    id: "n14",
    date: "2026-06-07",
    theme: "E",
    title: "LG에너지솔루션, 폐배터리 재활용 합작법인 설립",
    body: "LG에너지솔루션이 사용 후 배터리에서 금속을 회수하는 재활용 합작법인을 국내에 세운다. 합작사는 니켈·리튬 등 핵심광물 회수에 주력한다.",
    source: "전자신문",
    companies: ["LG에너지솔루션"],
    views: 1120,
  },
  {
    id: "n15",
    date: "2026-06-06",
    theme: "policy",
    title: "산업부, 배출권 거래 활성화 방안 발표",
    body: "산업통상자원부가 탄소배출권 시장의 유동성을 높이기 위한 거래 활성화 방안을 발표했다. 시장조성자 확대와 거래 정보 공개가 핵심이다.",
    source: "연합뉴스",
    companies: [],
    views: 700,
  },
  {
    id: "n16",
    date: "2026-06-04",
    theme: "S",
    title: "카카오, 디지털 접근성 개선 보고서 발간",
    body: "카카오가 장애인·고령자 등 디지털 취약계층의 서비스 접근성 개선 현황을 담은 보고서를 발간했다. 회사는 음성 안내와 자막 기능을 확대 적용한다.",
    source: "디지털데일리",
    companies: ["카카오"],
    views: 640,
  },
  {
    id: "n17",
    date: "2026-06-03",
    theme: "E",
    title: "한화솔루션, 재생에너지 장기 공급계약 확대",
    body: "한화솔루션이 국내외 사업장의 재생에너지 조달을 위한 장기 전력구매계약(PPA)을 확대한다. 회사는 2030년 재생에너지 사용 비율 목표를 상향했다.",
    source: "한국경제",
    companies: ["한화솔루션"],
    views: 820,
  },
  {
    id: "n18",
    date: "2026-06-02",
    theme: "G",
    title: "우리금융지주, 내부통제 혁신안 발표",
    body: "우리금융지주가 금융사고 예방을 위한 내부통제 책임구조 개편안을 발표했다. 개편안은 임원별 책임범위를 명확히 하는 책무구조도를 담았다.",
    source: "매일경제",
    companies: ["우리금융지주"],
    views: 580,
  },
];

// ── 뉴스 보강 생성기 — 날짜마다 페이지네이션이 생기도록 일자당 6건 채움(페이지당 2~4) ──
const NEWS_BASE_DATE = new Date(2026, 5, 8); // 2026-06-08
const NEWS_PER_DAY = 6;
const NEWS_SOURCES = [
  "한국경제",
  "매일경제",
  "ESG경제",
  "전자신문",
  "서울경제",
  "연합뉴스",
  "디지털데일리",
];
const NEWS_TITLE_TPL: Record<NewsTheme, string[]> = {
  E: [
    "{c}, 재생에너지 사용 확대 발표",
    "{c}, 탄소중립 이행 현황 공개",
    "{c}, 폐기물 재활용률 개선",
    "{c}, 수자원 사용 효율화 추진",
  ],
  S: [
    "{c}, 산업안전보건 체계 강화",
    "{c}, 협력사 동반성장 확대",
    "{c}, 임직원 다양성 정책 발표",
    "{c}, 사회공헌 프로그램 확대",
  ],
  G: [
    "{c}, 이사회 독립성 강화",
    "{c}, 전자투표제 적용 확대",
    "{c}, ESG 거버넌스 개편",
    "{c}, 주주환원 정책 공시",
  ],
  policy: [
    "금융위, 지속가능성 공시 기준 보완",
    "환경부, 온실가스 감축 지침 개정",
    "공정위, 지배구조 점검 강화",
    "산업부, 친환경 전환 지원 확대",
  ],
};
const NEWS_BODY_TPL: Record<NewsTheme, string> = {
  E: "회사는 환경 경영 추진 현황과 향후 온실가스 감축 계획을 공개했다. 관련 설비 투자와 재생에너지 전환 일정도 함께 제시했다.",
  S: "회사는 사회 책임 경영 관련 정책과 이행 현황을 밝혔다. 협력사와 임직원을 대상으로 한 프로그램을 확대한다고 설명했다.",
  G: "회사는 지배구조 개선과 주주가치 제고 방안을 제시했다. 이사회 독립성과 주주환원을 강화하는 내용을 담았다.",
  policy:
    "관계 당국이 ESG 관련 제도 개선 방향을 발표했다. 적용 대상과 시기를 단계적으로 확대한다는 방침이다.",
};
const NEWS_THEMES: NewsTheme[] = ["E", "S", "G", "policy"];

function newsHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function weekDateStrings(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(NEWS_BASE_DATE);
    d.setDate(d.getDate() - i);
    out.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
  }
  return out;
}
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function genNewsItem(date: string, idx: number): Omit<EsgNewsItem, "url"> {
  const seed = newsHash(`${date}#${idx}`);
  const theme = NEWS_THEMES[seed % NEWS_THEMES.length];
  const pool = BULK_COMPANIES;
  // ⚠️ 부호 없는 시프트(>>>) 사용 — >> 는 음수 인덱스가 되어 undefined 접근 크래시
  const company = theme === "policy" ? "" : pool[(seed >>> 2) % pool.length].name;
  const tpl = NEWS_TITLE_TPL[theme][(seed >>> 4) % NEWS_TITLE_TPL[theme].length];
  return {
    id: `${date}-g${idx}`,
    date,
    theme,
    title: company ? tpl.replace("{c}", company) : tpl,
    body: company ? `${company} 등 ${NEWS_BODY_TPL[theme]}` : NEWS_BODY_TPL[theme],
    source: NEWS_SOURCES[(seed >>> 6) % NEWS_SOURCES.length],
    companies: company ? [company] : [],
    views: 150 + (seed % 800), // 큐레이션 헤드라인보다 낮게
  };
}

export function getEsgNews(): EsgNewsItem[] {
  // → GET /api/news/esg
  const base: Omit<EsgNewsItem, "url">[] = [...NEWS];
  const countByDate: Record<string, number> = {};
  for (const n of base) countByDate[n.date] = (countByDate[n.date] ?? 0) + 1;

  // 주간 각 날짜를 NEWS_PER_DAY까지 보강 (페이지네이션 보장)
  for (const date of weekDateStrings()) {
    const have = countByDate[date] ?? 0;
    for (let j = have; j < NEWS_PER_DAY; j++) base.push(genNewsItem(date, j));
  }

  return base.map((n) => ({ ...n, url: `https://example.com/news/${n.id}` }));
}

// 공시 문서(종류별) — 원문 링크만(다운로드 X). 통합검색 결과 '공시' 리스트용.
export type DocType = "sr" | "business" | "governance";
export const DOC_TYPE_LABELS: Record<DocType, string> = {
  sr: "지속가능경영보고서",
  business: "사업보고서",
  governance: "기업지배구조보고서",
};
export const DOC_TYPE_SHORT: Record<DocType, string> = {
  sr: "지속가능",
  business: "사업",
  governance: "지배구조",
};
export interface DisclosureDocRow {
  company: string;
  stockCode: string;
  docType: DocType;
  year: number; // 대상(발간) 연도
  disclosedAt: string; // 등록일 YYYY-MM-DD
  url: string; // 원문 링크 (다운로드 아님)
}

export function getRecentDisclosures(): DisclosureDocRow[] {
  const YEAR = 2025; // 최신 회계연도
  const rows: DisclosureDocRow[] = [];
  const add = (id: string, name: string, docType: DocType) => {
    const seed = srHash(`${id}|${docType}`);
    const d = new Date(SR_BASE);
    d.setDate(d.getDate() - (seed % 90));
    rows.push({
      company: name,
      stockCode: id,
      docType,
      year: YEAR,
      disclosedAt: fmtDate(d),
      url: `https://example.com/${docType}/${id}`,
    });
  };
  for (const c of BULK_COMPANIES) {
    const seed = srHash(c.id);
    add(c.id, c.name, "business"); // 법정 의무공시 — 전체
    if (seed % 10 < 7) add(c.id, c.name, "sr"); // ~70%
    if (seed % 2 === 0) add(c.id, c.name, "governance"); // ~50%
  }
  return rows.sort((a, b) => (a.disclosedAt < b.disclosedAt ? 1 : -1));
}

// 최근 30일 내 SR 공시 건을 공시일 최신순으로 반환
export function getRecentSrDisclosures(): SrDisclosureRow[] {
  // → GET /api/stats/sr-disclosure?recent=30
  return BULK_COMPANIES.filter((c) => srHash(c.id) % 10 < 7) // ~70% 공시
    .map((c) => {
      const seed = srHash(c.id);
      const daysAgo = seed % 30;
      const d = new Date(SR_BASE);
      d.setDate(d.getDate() - daysAgo);
      return {
        company: c.name,
        stockCode: c.id,
        daysAgo,
        disclosedAt: fmtDate(d),
        url: `https://example.com/sr/${c.id}`, // 목업: 원문 뷰어(다운로드 아님)
      };
    })
    .sort((a, b) => a.daysAgo - b.daysAgo); // 최신순
}
