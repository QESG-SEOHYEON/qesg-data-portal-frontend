// ⭐ 법규위반·제재 데이터 경계 (제재 DB) — getSanctions(기업상세) / getSanctionCounts(그리드)
// 개별 제재 사건 1건 = 행. 테마는 E/S/G를 가로지름. 자동 생성(결정적).
// ⚠️ 안전선: 건수로 우열·등급·줄세우기 금지. 가치색(0=초록/많음=빨강) 금지. 우리 논평 없음.
import { BULK_COMPANIES } from "./bulkData";

export interface SanctionTheme {
  key: string;
  label: string; // 전체 명칭
  short: string; // 칩 축약
  tone: { bg: string; fg: string }; // 테마 구분용 중립색 (우열 아님)
}

// 테마 구분용 중립 톤(낮은 채도) — 좋고나쁨 아님. 실데이터 테마 대분류 기준.
export const SANCTION_THEMES: SanctionTheme[] = [
  { key: "env", label: "환경", short: "환경", tone: { bg: "#EEF3F8", fg: "#3F5E7A" } },
  { key: "safety", label: "산업안전", short: "안전", tone: { bg: "#F3F0EA", fg: "#6E5A36" } },
  { key: "labor", label: "노동인권", short: "노동", tone: { bg: "#EAF1F0", fg: "#3E6B5C" } },
  { key: "fairtrade", label: "공정거래", short: "공정", tone: { bg: "#F2EFF8", fg: "#5A4F86" } },
  { key: "privacy", label: "개인정보", short: "개인정보", tone: { bg: "#F0EEF2", fg: "#5C5470" } },
  { key: "product", label: "제품안전", short: "제품", tone: { bg: "#EFF1EA", fg: "#5E6033" } },
  { key: "control", label: "내부통제", short: "내부통제", tone: { bg: "#EEF1F4", fg: "#54607A" } },
  { key: "etc", label: "기타", short: "기타", tone: { bg: "#F1F0EE", fg: "#6B645B" } },
];
export const themeOf = (key: string) => SANCTION_THEMES.find((t) => t.key === key);

export interface Sanction {
  id: string;
  company: string;
  stockCode: string;
  year: number;
  date: string; // 위반일자 YYYY-MM-DD
  themeKey: string;
  theme: string;
  agency: string; // 처분기관
  target: string; // 대상
  penaltyType: string; // 처벌구분
  penaltyDetail: string; // 처벌내용
  reason: string; // 위반사유
  law: string; // 근거법령
  url: string; // 원문(공시) 링크
}

const AGENCY: Record<string, string> = {
  env: "환경부",
  safety: "고용노동부",
  labor: "고용노동부",
  fairtrade: "공정거래위원회",
  privacy: "개인정보보호위원회",
  product: "식품의약품안전처",
  control: "금융감독원",
  etc: "한국거래소",
};
const LAW: Record<string, string> = {
  env: "대기환경보전법",
  safety: "산업안전보건법",
  labor: "근로기준법",
  fairtrade: "독점규제 및 공정거래에 관한 법률",
  privacy: "개인정보 보호법",
  product: "제품안전기본법",
  control: "주식회사 등의 외부감사에 관한 법률",
  etc: "자본시장과 금융투자업에 관한 법률",
};
const REASON: Record<string, string> = {
  env: "대기오염물질 배출허용기준 초과",
  safety: "안전조치 의무 위반 (MSDS 미실시 등)",
  labor: "근로기준 위반",
  fairtrade: "부당한 공동행위(담합) 등",
  privacy: "개인정보 안전조치 의무 위반",
  product: "제품 표시·안전 기준 위반",
  control: "공시의무 위반 / 내부회계관리 미흡",
  etc: "기타 행정 제재",
};
const PENALTY = ["과태료", "과징금", "벌금", "시정", "경고", "정지", "개선"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const pad = (n: number) => String(n).padStart(2, "0");

function penaltyDetail(type: string, seed: number): string {
  if (type === "과징금") return `과징금 ${1 + (seed % 80)}억원`;
  if (type === "과태료") return `과태료 ${100 + (seed % 900)}만원`;
  if (type === "벌금") return `벌금 ${500 + (seed % 4500)}만원`;
  if (type === "정지") return `영업정지 ${5 + (seed % 25)}일`;
  return type; // 시정 / 경고 / 개선
}

const cache = new Map<string, Sanction[]>();

export function getSanctions(companyId: string): Sanction[] {
  if (cache.has(companyId)) return cache.get(companyId)!;
  const bulk = BULK_COMPANIES.find((c) => c.id === companyId);
  const name = bulk?.name ?? companyId;
  const seed = hash(companyId);
  const n = seed % 7; // 0~6건
  const list: Sanction[] = [];
  for (let i = 0; i < n; i++) {
    const s = hash(`${companyId}#${i}`);
    const theme = SANCTION_THEMES[s % SANCTION_THEMES.length];
    const year = 2023 + ((s >>> 2) % 3);
    const month = 1 + ((s >>> 4) % 12);
    const day = 1 + ((s >>> 7) % 28);
    const penaltyType = PENALTY[(s >>> 3) % PENALTY.length];
    list.push({
      id: `${companyId}-sx${i}`,
      company: name,
      stockCode: companyId,
      year,
      date: `${year}-${pad(month)}-${pad(day)}`,
      themeKey: theme.key,
      theme: theme.label,
      agency: AGENCY[theme.key],
      target: name,
      penaltyType,
      penaltyDetail: penaltyDetail(penaltyType, s),
      reason: REASON[theme.key],
      law: LAW[theme.key],
      url: `https://example.com/sanction/${companyId}/${i}`,
    });
  }
  list.sort((a, b) => (a.date < b.date ? 1 : -1)); // 최신순
  cache.set(companyId, list);
  return list;
}

// 그리드용: 기업×테마 건수 (연도 필터 옵션). 총건수는 제공하지 않음(테마별만).
export function getSanctionCounts(
  companyIds: string[],
  years?: number[],
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const id of companyIds) {
    const counts: Record<string, number> = {};
    for (const s of getSanctions(id)) {
      if (years && years.length > 0 && !years.includes(s.year)) continue;
      counts[s.themeKey] = (counts[s.themeKey] ?? 0) + 1;
    }
    out[id] = counts;
  }
  return out;
}
