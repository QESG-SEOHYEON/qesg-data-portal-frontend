import { useEffect } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router";
import { ConfigProvider, App as AntdApp } from "antd";
import { qesgTheme } from "@/theme/tokens";
import { PlanProvider } from "@/mock/planContext";
import { Layout } from "@/components/Layout";
import { LandingPage } from "@/pages/landing/LandingPage";
import { CompanyDetailPage } from "@/pages/company/CompanyDetailPage";
import { ConditionSearchPage } from "@/pages/condition/ConditionSearchPage";
import { WorkspacePage } from "@/pages/workspace/WorkspacePage";
import { PortfolioPage } from "@/pages/workspace/PortfolioPage";
import { PricingPage } from "@/pages/pricing/PricingPage";

// 라우트(경로) 이동 시 상단에서 시작 — 해시(#sanctions 등) 진입은 해당 화면 핸들러가 처리
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <ConfigProvider theme={qesgTheme}>
      <AntdApp>
        <PlanProvider>
        <HashRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/company/:companyId" element={<CompanyDetailPage />} />
              <Route path="/bulk" element={<ConditionSearchPage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/pricing" element={<PricingPage />} />
            </Route>
          </Routes>
        </HashRouter>
        </PlanProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
