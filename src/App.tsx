import { BrowserRouter, Routes, Route } from "react-router";
import { ConfigProvider, App as AntdApp } from "antd";
import { qesgTheme } from "@/theme/tokens";
import { Layout } from "@/components/Layout";
import { LandingPage } from "@/pages/landing/LandingPage";
import { CompanyDetailPage } from "@/pages/company/CompanyDetailPage";
import { ConditionSearchPage } from "@/pages/condition/ConditionSearchPage";

export default function App() {
  return (
    <ConfigProvider theme={qesgTheme}>
      <AntdApp>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/company/:companyId" element={<CompanyDetailPage />} />
              <Route path="/bulk" element={<ConditionSearchPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
