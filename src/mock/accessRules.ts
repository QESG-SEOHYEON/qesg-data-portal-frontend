// ⭐ 공용 회원 등급 노출 규칙 (qesg-access-rules-spec) — 화면은 CAN/VISIBLE_COUNT만 참조.
// 규칙이 바뀌면 이 RULES만 수정하면 전 화면 반영. 실제 권한/세션은 후속(목업은 데모 셀렉터 분기만).
// tier 코드: guest(비회원) / member(개인X=free) / memberPlan(개인O=pro) / enterprise(기업O) / admin
import type { ViewerPlan } from "@/types";

export type AiMode = false | "daily1" | true;
export type TrendMode = "1y" | "multi";
export type Feature =
  | "meta"
  | "workspace"
  | "save"
  | "excel"
  | "bulk"
  | "portfolioBatch"
  | "api"
  | "allColumns"
  | "sanctionDetail"
  | "manage";
export type CountKind = "rows" | "indicatorsPerCategory";

interface Rule {
  meta: boolean;
  ai: AiMode;
  workspace: boolean;
  save: boolean;
  excel: boolean;
  bulk: boolean | "personal";
  portfolioBatch: boolean;
  api: boolean;
  rows: number;
  indicatorsPerCategory: number;
  trend: TrendMode;
  allColumns: boolean;
  sanctionDetail: boolean;
  manage?: boolean;
}

export const FREE_ROW_LIMIT = 10;
export const FREE_INDICATORS_PER_CATEGORY = 3;

const RULES: Record<ViewerPlan, Rule> = {
  guest: {
    meta: false,
    ai: false,
    workspace: false,
    save: false,
    excel: false,
    bulk: false,
    portfolioBatch: false,
    api: false,
    rows: FREE_ROW_LIMIT,
    indicatorsPerCategory: FREE_INDICATORS_PER_CATEGORY,
    trend: "1y",
    allColumns: false,
    sanctionDetail: false,
  },
  member: {
    meta: true,
    ai: "daily1",
    workspace: false,
    save: false,
    excel: false,
    bulk: false,
    portfolioBatch: false,
    api: false,
    rows: Infinity,
    indicatorsPerCategory: Infinity,
    trend: "multi",
    allColumns: true,
    sanctionDetail: true,
  },
  memberPlan: {
    meta: true,
    ai: true,
    workspace: true,
    save: true,
    excel: true,
    bulk: "personal",
    portfolioBatch: false,
    api: false,
    rows: Infinity,
    indicatorsPerCategory: Infinity,
    trend: "multi",
    allColumns: true,
    sanctionDetail: true,
  },
  enterprise: {
    meta: true,
    ai: true,
    workspace: true,
    save: true,
    excel: true,
    bulk: true,
    portfolioBatch: true,
    api: true,
    rows: Infinity,
    indicatorsPerCategory: Infinity,
    trend: "multi",
    allColumns: true,
    sanctionDetail: true,
  },
  admin: {
    meta: true,
    ai: true,
    workspace: true,
    save: true,
    excel: true,
    bulk: true,
    portfolioBatch: true,
    api: true,
    rows: Infinity,
    indicatorsPerCategory: Infinity,
    trend: "multi",
    allColumns: true,
    sanctionDetail: true,
    manage: true,
  },
};

/** 기능 권한 (truthy). 주의: ai:"daily1"·bulk:"personal"도 truthy → 횟수/범위는 aiMode 등 별도 분기 */
export function CAN(tier: ViewerPlan, feature: Feature): boolean {
  return !!RULES[tier]?.[feature];
}
/** 노출 개수 (rows / indicatorsPerCategory) */
export function VISIBLE_COUNT(tier: ViewerPlan, kind: CountKind): number {
  return RULES[tier]?.[kind] ?? 0;
}
export function TIER_RULE(tier: ViewerPlan): Rule {
  return RULES[tier];
}
export function aiMode(tier: ViewerPlan): AiMode {
  return RULES[tier].ai;
}
export function trendMode(tier: ViewerPlan): TrendMode {
  return RULES[tier].trend;
}
/** 잠금 유도 문구 (잠금선별) */
export function lockCta(tier: ViewerPlan): string {
  if (tier === "guest") return "로그인하고 보기";
  if (tier === "member") return "서비스 소개";
  if (tier === "memberPlan") return "기업 플랜에서 이용";
  return "";
}
