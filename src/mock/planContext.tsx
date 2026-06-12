// 데모 등급(플랜) 전역 상태 — 페이지를 이동해도 셀렉터로 고른 등급이 유지됨.
// 모든 화면이 같은 plan을 공유 → 노출 잠금이 일관되게 동작(중구난방 방지).
import { createContext, useCallback, useContext, useState } from "react";
import type { ViewerPlan } from "@/types";

const KEY = "qesg-demo-plan";

function initialPlan(): ViewerPlan {
  try {
    const v = localStorage.getItem(KEY);
    if (v) return v as ViewerPlan;
  } catch {
    /* noop */
  }
  return "guest";
}

const PlanCtx = createContext<[ViewerPlan, (p: ViewerPlan) => void] | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanState] = useState<ViewerPlan>(initialPlan);
  const setPlan = useCallback((p: ViewerPlan) => {
    setPlanState(p);
    try {
      localStorage.setItem(KEY, p);
    } catch {
      /* noop */
    }
  }, []);
  return <PlanCtx.Provider value={[plan, setPlan]}>{children}</PlanCtx.Provider>;
}

export function usePlan(): [ViewerPlan, (p: ViewerPlan) => void] {
  const ctx = useContext(PlanCtx);
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
}
