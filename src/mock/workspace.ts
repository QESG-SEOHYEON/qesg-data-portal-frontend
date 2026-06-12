// ⭐ 워크스페이스 데이터 경계 — 함수콜링(테이블 조작) + RAG(근거 답변) 목업.
// 실제 RAG·함수콜링·LLM은 후속. 이 시연이 곧 백엔드 명세. 정해진 4개 시나리오만 반응.
// ⚠️ 안전선: 평가·순위·점수 함수는 의도적으로 존재하지 않음. 평가성 질의는 데이터 우회(D).
import { BULK_COMPANIES } from "./bulkData";

// 테이블 조작 함수 목록 (시연·문서용) — 평가/순위/점수 함수 없음
export const TABLE_FUNCTIONS = [
  "setCompanies",
  "addIndicator",
  "removeIndicator",
  "filterRows",
  "sortBy",
  "loadPortfolio",
] as const;

export interface Portfolio {
  id: string;
  name: string;
  companyIds: string[];
  savedAt?: string; // 사용자 생성분만 (YYYY-MM-DD)
}

// 채우기용 사전 정의 포트폴리오 (시나리오 A·E loadPortfolio 대상)
// p1은 식품 기업을 포함시켜 "식품만 추려 정렬"(E) 시연이 비지 않게 함.
const FOOD = BULK_COMPANIES.filter((c) => c.sector === "식품")
  .slice(0, 3)
  .map((c) => c.id);
const NON_FOOD = BULK_COMPANIES.filter((c) => c.sector !== "식품")
  .slice(0, 5)
  .map((c) => c.id);
const DEFAULT_PORTFOLIOS: Portfolio[] = [
  { id: "p1", name: "내 관심 포트폴리오", companyIds: [...NON_FOOD, ...FOOD] },
  {
    id: "p2",
    name: "반도체 비교군",
    companyIds: BULK_COMPANIES.filter((c) => c.sector === "반도체")
      .slice(0, 6)
      .map((c) => c.id),
  },
];
// 사용자가 만든 포트폴리오(기업리스트) — localStorage 저장
const PF_KEY = "qesg_ws_portfolios";
function getUserPortfolios(): Portfolio[] {
  try {
    return JSON.parse(localStorage.getItem(PF_KEY) || "[]") as Portfolio[];
  } catch {
    return [];
  }
}
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// 기본(샘플) 폴더는 누구나 보유 — 편집(기업 추가)하면 사용자본이 동일 id로 덮어씀.
// "내 관심 포트폴리오"(p1)는 개인회원(플랜X) 포함 기본 폴더.
export function getPortfolios(): Portfolio[] {
  const user = getUserPortfolios();
  const byId = new Map(user.map((p) => [p.id, p]));
  const merged = DEFAULT_PORTFOLIOS.map((d) => byId.get(d.id) ?? d);
  const extras = user.filter((p) => !DEFAULT_PORTFOLIOS.some((d) => d.id === p.id));
  return [...merged, ...extras];
}
export function getPortfolio(id: string): Portfolio | undefined {
  return getPortfolios().find((p) => p.id === id);
}
export function savePortfolio(name: string, companyIds: string[]): Portfolio {
  const pf: Portfolio = { id: `pf${new Date().getTime()}`, name, companyIds, savedAt: today() };
  try {
    localStorage.setItem(PF_KEY, JSON.stringify([pf, ...getUserPortfolios()]));
  } catch {
    /* noop */
  }
  return pf;
}
// 폴더(기업리스트)에 기업 1곳 추가 — 기본 폴더면 사용자본으로 복제 후 추가
export function addCompanyToPortfolio(id: string, companyId: string): Portfolio | undefined {
  const user = getUserPortfolios();
  let idx = user.findIndex((p) => p.id === id);
  if (idx === -1) {
    const def = DEFAULT_PORTFOLIOS.find((p) => p.id === id);
    if (!def) return undefined;
    user.unshift({ ...def, companyIds: [...def.companyIds] });
    idx = 0;
  }
  const pf = user[idx];
  if (!pf.companyIds.includes(companyId)) {
    user[idx] = { ...pf, companyIds: [...pf.companyIds, companyId], savedAt: today() };
  }
  try {
    localStorage.setItem(PF_KEY, JSON.stringify(user));
  } catch {
    /* noop */
  }
  return user[idx];
}

// ── 저장된 작업(테이블 상태) — 마이 포트폴리오 저장소 ──
export interface WsSort {
  colId: string;
  subCode: string | null;
  year: number;
  dir: "asc" | "desc";
}
export interface SavedState {
  companyIds: string[];
  indicatorIds: string[];
  sectors: string[];
  years: number[];
  showSanctions: boolean;
  rowFilter?: { colId: string; value: string } | null; // AI 필터(미도입 등)
  sort?: WsSort | null; // 정렬
}
export interface SavedWork extends SavedState {
  id: string;
  name: string;
  savedAt: string; // YYYY-MM-DD
}
const WORKS_KEY = "qesg_ws_works";

export function getSavedWorks(): SavedWork[] {
  try {
    return JSON.parse(localStorage.getItem(WORKS_KEY) || "[]") as SavedWork[];
  } catch {
    return [];
  }
}
export function getSavedWork(id: string): SavedWork | undefined {
  return getSavedWorks().find((w) => w.id === id);
}
export function saveWorkspace(name: string, state: SavedState): SavedWork {
  const d = new Date();
  const savedAt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const work: SavedWork = { id: `w${d.getTime()}`, name, savedAt, ...state };
  try {
    const list = getSavedWorks();
    localStorage.setItem(WORKS_KEY, JSON.stringify([work, ...list]));
  } catch {
    /* noop */
  }
  return work;
}

// 관심 기업 (저장소) — 목업: 일부 기업 고정
export function getFavoriteCompanies(): { id: string; name: string; sector: string }[] {
  return BULK_COMPANIES.slice(0, 6).map((c) => ({ id: c.id, name: c.name, sector: c.sector }));
}
// 다운로드 이력 — 저장(localStorage) + 기본 샘플
export interface Download {
  name: string;
  date: string;
  kind: string;
}
const DL_KEY = "qesg_ws_downloads";
const DEFAULT_DOWNLOADS: Download[] = [
  { name: "포트폴리오_ESG_2024.xlsx", date: "2026-05-30", kind: "Excel" },
  { name: "반도체_비교군_온실가스.xlsx", date: "2026-05-18", kind: "Excel" },
];
export function getDownloads(): Download[] {
  try {
    const saved = JSON.parse(localStorage.getItem(DL_KEY) || "[]") as Download[];
    return [...saved, ...DEFAULT_DOWNLOADS];
  } catch {
    return DEFAULT_DOWNLOADS;
  }
}
export function addDownload(name: string, kind = "Excel"): Download {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const item: Download = { name, date, kind };
  try {
    const saved = JSON.parse(localStorage.getItem(DL_KEY) || "[]") as Download[];
    localStorage.setItem(DL_KEY, JSON.stringify([item, ...saved]));
  } catch {
    /* noop */
  }
  return item;
}

// ── AI 시나리오 (함수콜링 + RAG) ──
export interface RagCard {
  title: string;
  text: string;
  source: string;
  url: string;
}
export type WsOp =
  | { type: "loadPortfolio"; portfolioId: string }
  | { type: "addIndicator"; code: string }
  | { type: "addIndicators"; codes: string[] }
  | { type: "filterRows"; colId: string; value: string }
  | { type: "filterSector"; sector: string } // 현재 기업을 그 업종만 남김
  | { type: "sortBy"; colId: string; subCode: string | null; dir: "asc" | "desc" }
  | { type: "setYears"; years: number[] };
export interface WsStep {
  kind: "fn" | "rag" | "reject" | "chart";
  tag?: string; // 함수 호출 태그(어드민 모드 — 모노스페이스)
  say?: string; // 사용자 모드 표현(친화 문구, 진행형)
  op?: WsOp; // 테이블 조작
  card?: RagCard; // RAG 근거 카드
  text?: string; // 거절/안내 문구
  chart?: { code: string; title: string }; // 차트 카드(현재 표 기준)
}
export interface WsScenario {
  id: string;
  chip: string; // 예시 칩 라벨
  query: string; // 사용자 말풍선
  keywords: string[]; // 자유 입력 매칭용
  needsRows?: boolean; // 현재 표(기업)가 있어야 동작 — 비면 안내
  steps: WsStep[];
}

export const WORKSPACE_SCENARIOS: WsScenario[] = [
  {
    id: "A",
    chip: "전자투표제 미도입인 곳만",
    query: "지금 표(내 포트폴리오)에서 전자투표제 미도입인 곳만 보여줘",
    keywords: ["전자투표", "미도입"],
    needsRows: true,
    steps: [
      {
        kind: "fn",
        tag: "addIndicator('G1')",
        say: "전자투표제 지표 불러오는 중",
        op: { type: "addIndicator", code: "G1" },
      },
      {
        kind: "fn",
        tag: "filterRows(전자투표제 = 미도입)",
        say: "전자투표제 미도입 여부 확인 중",
        op: { type: "filterRows", colId: "G1", value: "not_adopted" },
      },
    ],
  },
  {
    id: "H",
    chip: "동종업계 온실가스 비교",
    query: "동종업계와 온실가스 배출량 비교해줘",
    keywords: ["동종", "비교"],
    needsRows: true,
    steps: [
      { kind: "fn", tag: "addIndicator('E3_1')", say: "온실가스 배출량 지표 불러오는 중", op: { type: "addIndicator", code: "E3_1" } },
      { kind: "fn", tag: "sortBy('E3_1', desc)", say: "배출량 높은 순으로 정렬 중", op: { type: "sortBy", colId: "E3_1", subCode: "total", dir: "desc" } },
      { kind: "chart", tag: "차트: 동종업계 온실가스", chart: { code: "E3_1", title: "온실가스 배출량 — 동종업계 (FY2025 기준)" } },
    ],
  },
  {
    id: "B",
    chip: "온실가스 배출량 추가 + 근거",
    query: "온실가스 배출량 지표 추가하고 근거도 같이 보여줘",
    keywords: ["온실가스", "근거", "추가"],
    needsRows: true,
    steps: [
      {
        kind: "fn",
        tag: "addIndicator('E3_1')",
        say: "온실가스 배출량 지표 불러오는 중",
        op: { type: "addIndicator", code: "E3_1" },
      },
      {
        kind: "rag",
        tag: "RAG 검색: 온실가스 배출량 정의·공시",
        card: {
          title: "온실가스 배출량 (Scope 1·2·3)",
          text: "직접배출(Scope1)·간접배출(Scope2)·기타 가치사슬 배출(Scope3)의 합계로, 단위는 tCO₂eq. 표의 수치는 각 기업이 지속가능경영보고서·환경정보공개시스템에 공시한 값입니다.",
          source: "지속가능경영보고서 2024, p.62 · 환경정보공개시스템",
          url: "https://example.com/sr/2024/ghg",
        },
      },
    ],
  },
  {
    id: "C",
    chip: "삼성전자 기후리스크 공시 내용",
    query: "삼성전자 기후리스크 공시 내용 알려줘",
    keywords: ["삼성", "기후리스크", "공시내용"],
    steps: [
      {
        kind: "rag",
        tag: "RAG 검색: 삼성전자 기후리스크 서술형",
        card: {
          title: "삼성전자 — 기후리스크 관리체계",
          text: "TCFD 권고안에 따라 전환리스크·물리적리스크를 식별하고, 이사회 산하 지속가능경영위원회가 감독합니다. 시나리오 분석(1.5℃/NDC)을 통해 탄소비용·규제 영향을 평가한다고 공시하고 있습니다. (요약은 공시 원문 기반이며 평가가 아닙니다.)",
          source: "삼성전자 지속가능경영보고서 2024, 기후변화 대응 섹션",
          url: "https://example.com/sr/samsung/climate",
        },
      },
    ],
  },
  {
    id: "D",
    chip: "ESG 순위 매겨줘",
    query: "이 기업들 ESG 점수로 순위 매겨줘",
    keywords: ["순위", "점수", "등급", "랭킹", "평가"],
    needsRows: true,
    steps: [
      {
        kind: "reject",
        text: "순위·점수·등급 산출 기능은 제공하지 않습니다. QESG 포털은 기업 평가에 대한 의견을 제공하지 않습니다. 대신 판단에 필요한 원본 지표를 테이블에 띄웠습니다.",
        op: { type: "addIndicators", codes: ["E3_1", "G1", "S30"] },
      },
    ],
  },
  {
    id: "E",
    chip: "식품 기업만 · 온실가스 높은 순",
    query: "지금 표에서 식품 기업만 추려서 온실가스 배출량 높은 순으로 보여줘",
    keywords: ["식품", "높은 순", "높은순", "정렬", "내림차순"],
    needsRows: true,
    steps: [
      {
        kind: "fn",
        tag: "filterRows(업종 = 식품)",
        say: "식품 기업만 추리는 중",
        op: { type: "filterSector", sector: "식품" },
      },
      {
        kind: "fn",
        tag: "addIndicator('E3_1')",
        say: "온실가스 배출량 지표 불러오는 중",
        op: { type: "addIndicator", code: "E3_1" },
      },
      {
        kind: "fn",
        tag: "sortBy('E3_1', desc)",
        say: "배출량 높은 순으로 정렬 중",
        op: { type: "sortBy", colId: "E3_1", subCode: "total", dir: "desc" },
      },
      {
        kind: "chart",
        tag: "차트: 온실가스 배출량(식품)",
        chart: { code: "E3_1", title: "온실가스 배출량 — 식품 기업 (FY2025 기준)" },
      },
    ],
  },
  {
    id: "F",
    chip: "협력사(비상장) 온실가스 3개년",
    query: "이 상장사들의 협력사(비상장 포함) 온실가스 배출량을 3개년 표로 보여줘",
    keywords: ["협력사", "비상장", "비상장사"],
    needsRows: true,
    steps: [
      {
        kind: "reject",
        text: "비상장 협력사의 배출량 데이터는 보유하고 있지 않습니다. QESG 포털은 공시·수집된 상장사 데이터만 제공하며, 없는 데이터를 추정·생성하지 않아요. 대신 현재 기업들의 공시된 온실가스 배출량 3개년을 표로 띄웠습니다.",
        op: { type: "setYears", years: [2023, 2024, 2025] },
      },
      {
        kind: "fn",
        tag: "addIndicator('E3_1')",
        say: "공시된 온실가스 3개년 불러오는 중",
        op: { type: "addIndicator", code: "E3_1" },
      },
    ],
  },
  {
    id: "G",
    chip: "이 데이터 출처는?",
    query: "이 데이터의 원문(출처)이 어떻게 돼?",
    keywords: ["출처", "원문", "어디서", "소스"],
    steps: [
      {
        kind: "rag",
        tag: "RAG 검색: 데이터 출처·원문",
        card: {
          title: "데이터 출처",
          text: "표의 온실가스 배출량은 각 기업이 환경정보공개시스템(환경부)·지속가능경영보고서에 공시한 값을 수집한 것입니다. 수치마다 출처 문서·연도를 보관하며, QESG는 가공·평가 없이 원본을 그대로 제공합니다.",
          source: "환경정보공개시스템 · 지속가능경영보고서 2024",
          url: "https://example.com/source/ghg",
        },
      },
    ],
  },
];
