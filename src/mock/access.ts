// ⭐ 단일 권한/과금 레이어 (기획안 5.2 + "권한 판정을 단일 레이어로")
// 잠금 결정을 라우터·컴포넌트에 흩지 않고 여기 한 곳에 모은다.
// 실제 전환 시: tier는 백엔드 observation.tier 컬럼으로, 플랜은 인증 토큰으로 교체.
import type { SourceCode, Tier, ViewerPlan } from "@/types";

// 출처 → 기본 tier (NICE식 출처 기준 경계)
// 공개 공시(DART/환경정보공개/NGMS) = 무료, 가공·평가(SR/NICE) = 유료.
const SOURCE_TIER: Record<SourceCode, Tier> = {
  DART: "free",
  ENV: "free",
  NGMS: "free",
  SR: "basic",
  NICE: "basic",
};

/**
 * 데이터 포인트 1건의 tier 판정 (출처 + 다개년 규칙 결합).
 * 기획안 5.2: "공개 공시는 무료를 후하게, 단 다개년 추이는 유료".
 * → 공개 출처라도 최신 연도만 무료, 과거 연도는 basic.
 */
export function tierOf(sourceCode: SourceCode, fiscalYear: number, latestYear: number): Tier {
  const base = SOURCE_TIER[sourceCode];
  if (base !== "free") return base; // 가공·평가 출처는 연도 무관 유료
  return fiscalYear === latestYear ? "free" : "basic"; // 공개 출처: 최신만 무료
}

// 플랜이 접근 가능한 tier 집합 (단일 권한 레이어의 핵심 표)
const PLAN_TIERS: Record<ViewerPlan, Tier[]> = {
  guest: ["free"], // 비회원: 무료 미리보기
  member: ["free"], // 개인(플랜X): 무료만
  memberPlan: ["free", "basic"], // 개인(플랜O): 전체 + 다개년
  enterprise: ["free", "basic", "enterprise"], // 기업(플랜O)
  admin: ["free", "basic", "enterprise"], // 어드민: 전체
};

/** 플랜이 해당 tier에 접근 가능한가 */
export function canAccess(plan: ViewerPlan, tier: Tier): boolean {
  return PLAN_TIERS[plan].includes(tier);
}
/** Excel·API·대량 등 "플랜(유료) 전체 접근" 권한 — 기업·어드민 */
export function isEnterprise(plan: ViewerPlan): boolean {
  return plan === "enterprise" || plan === "admin";
}

// 회원 등급 — 전역 순서·라벨 (조회 플랜 토글 공용)
export const PLAN_ORDER: ViewerPlan[] = ["guest", "member", "memberPlan", "enterprise", "admin"];
export const PLAN_LABELS: Record<ViewerPlan, string> = {
  guest: "비회원",
  member: "개인회원(플랜X)",
  memberPlan: "개인회원(플랜O)",
  enterprise: "기업(플랜O)",
  admin: "어드민",
};

// 표(컬럼=지표) 동시 조회 한도 — 초과 시 업그레이드 유도 (가안)
export const COLUMN_LIMIT: Record<ViewerPlan, number> = {
  guest: 4,
  member: 6,
  memberPlan: 12,
  enterprise: Infinity,
  admin: Infinity,
};
export function columnLimitOf(plan: ViewerPlan): number {
  return COLUMN_LIMIT[plan];
}
