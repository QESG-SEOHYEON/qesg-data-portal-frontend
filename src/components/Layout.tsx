// 공통 레이아웃 — 글로벌 헤더 + 라우트 콘텐츠(Outlet)
import { Outlet } from "react-router";
import { AppHeader } from "./AppHeader";

export function Layout() {
  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
}
