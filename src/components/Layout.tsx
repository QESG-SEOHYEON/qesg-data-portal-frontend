// 공통 레이아웃 — 글로벌 헤더 + 라우트 콘텐츠(Outlet)
// 경로 변경 시 항상 최상단으로 스크롤 (상세 진입 등)
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { AppHeader } from "./AppHeader";

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
}
