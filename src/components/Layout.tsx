// 공통 레이아웃 — 글로벌 헤더 + 라우트 콘텐츠(Outlet) + 전역 푸터
// 경로 변경 시 항상 최상단으로 스크롤 (상세 진입 등)
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { AppHeader } from "./AppHeader";
import { Footer } from "./Footer";

export function Layout() {
  const { pathname, search } = useLocation();
  // 경로뿐 아니라 쿼리(GNB 환경/사회/지배구조 = /bulk?cat=…)가 바뀌어도 최상단으로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return (
    <>
      <AppHeader />
      <Outlet />
      <Footer />
    </>
  );
}
