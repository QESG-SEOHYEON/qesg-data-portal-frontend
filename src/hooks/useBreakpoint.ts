// 반응형 브레이크포인트 훅 (스펙 8장 공용 반응형 규칙)
// wide ≥1280 (우측 레일) / desktop 1024~1279 / tablet 640~1023 / mobile <640
import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop" | "wide";

function current(): Breakpoint {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  if (w < 1280) return "desktop";
  return "wide";
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(current);
  useEffect(() => {
    const onResize = () => setBp(current());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return bp;
}
