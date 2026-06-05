import { BrowserRouter, Routes, Route } from "react-router";
import { ConfigProvider, App as AntdApp } from "antd";
import { qesgTheme } from "@/theme/tokens";
import { Layout } from "@/components/Layout";
import { LandingPage } from "@/pages/landing/LandingPage";
import { CompanyDetailPage } from "@/pages/company/CompanyDetailPage";
import { BulkTablePage } from "@/pages/bulk/BulkTablePage";

export default function App() {
  return (
    <ConfigProvider theme={qesgTheme}>
      <AntdApp>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/company/:companyId" element={<CompanyDetailPage />} />
              <Route path="/bulk" element={<BulkTablePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}
