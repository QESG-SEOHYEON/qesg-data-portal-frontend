// 기업 ESG 정보 검색 (기업회원 전용 값 — 기획안 4.3 대량 조회)
// 조건검색(카테고리·섹터·포트폴리오) → 다수 기업 일괄 그리드.
// 행/열 골격은 노출, 셀 값은 기업회원만(plan!==enterprise → 잠금).
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Segmented, Select, Checkbox, Button, Modal, Input, Tooltip, Tag } from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  ApiOutlined,
  ProfileOutlined,
  LockOutlined,
} from "@ant-design/icons";
import type { Category, ViewerPlan } from "@/types";
import { PLAN_LABELS } from "@/mock/access";
import { getBulkData, SECTORS } from "@/mock/bulkData";
import { colors, categoryColors } from "@/theme/tokens";
import { LoginModal } from "@/pages/landing/components/LoginModal";
import { BulkGrid } from "./components/BulkGrid";

const PLANS: ViewerPlan[] = ["guest", "member", "enterprise"];
const CAT_OPTIONS = (["E", "S", "G"] as Category[]).map((c) => ({
  label: categoryColors[c].name,
  value: c,
}));

export function BulkTablePage() {
  const [plan, setPlan] = useState<ViewerPlan>("guest");
  const [categories, setCategories] = useState<Category[]>(["E", "S", "G"]);
  const [sector, setSector] = useState<string | undefined>(undefined);
  const [companyIds, setCompanyIds] = useState<string[] | undefined>(undefined);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [portfolioText, setPortfolioText] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);

  const locked = plan !== "enterprise"; // 대량 값은 기업회원 전용
  const canExport = plan === "enterprise";

  const data = useMemo(
    () => getBulkData({ categories, sector, companyIds }),
    [categories, sector, companyIds],
  );

  function applyPortfolio() {
    const codes = portfolioText
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => /^\d{6}$/.test(s));
    setCompanyIds(codes.length > 0 ? codes : undefined);
    setPortfolioOpen(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px 40px" }}>
        {/* 상단 */}
        <Link
          to="/"
          style={{ fontSize: 13, color: colors.textSub, display: "inline-flex", gap: 6, alignItems: "center" }}
        >
          <ArrowLeftOutlined /> 홈
        </Link>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            margin: "10px 0 18px",
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: colors.textBase }}>
            기업 ESG 정보 검색
            <span style={{ fontSize: 14, fontWeight: 500, color: colors.textSub, marginLeft: 10 }}>
              {data.companies.length}개 기업 · {data.indicators.length}개 지표
            </span>
          </h1>
          {/* 플랜 셀렉터 (잠금 데모) */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.textSub }}>조회 플랜</span>
            <Segmented
              size="small"
              value={plan}
              onChange={(v) => setPlan(v as ViewerPlan)}
              options={PLANS.map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
            />
          </div>
        </div>

        {/* 조건 검색 바 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.textSub }}>분류</span>
            <Checkbox.Group
              options={CAT_OPTIONS}
              value={categories}
              onChange={(v) => setCategories(v as Category[])}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: colors.textSub }}>섹터</span>
            <Select
              allowClear
              placeholder="전체"
              style={{ width: 150 }}
              value={sector}
              onChange={setSector}
              options={SECTORS.map((s) => ({ label: s, value: s }))}
              disabled={!!companyIds}
            />
          </div>
          <Button icon={<ProfileOutlined />} onClick={() => setPortfolioOpen(true)}>
            포트폴리오 일괄 조회
          </Button>
          {companyIds && (
            <Tag closable onClose={() => setCompanyIds(undefined)} color="processing">
              포트폴리오 {companyIds.length}종목 적용 중
            </Tag>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <Tooltip title={canExport ? "" : "기업 회원 전용"}>
              <Button icon={<DownloadOutlined />} disabled={!canExport} onClick={() => console.log("export-xlsx")}>
                Excel
              </Button>
            </Tooltip>
            <Tooltip title={canExport ? "" : "기업 회원 전용"}>
              <Button icon={<ApiOutlined />} disabled={!canExport} onClick={() => console.log("export-api")}>
                API
              </Button>
            </Tooltip>
          </div>
        </div>

        {/* 잠금 배너 */}
        {locked && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#FFF8EC",
              border: "1px solid #F3E2BE",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 14,
              fontSize: 13.5,
              color: "#7A5B17",
            }}
          >
            <LockOutlined />
            <span style={{ flex: 1 }}>
              기업 ESG 정보 값은 <strong>기업 회원 전용</strong>입니다. 지금은 기업·지표 골격만 미리보기 중 —
              가입하면 전체 수치가 열립니다.
            </span>
            <Button size="small" type="primary" onClick={() => setLoginOpen(true)}>
              가입하고 보기
            </Button>
          </div>
        )}

        {/* 그리드 */}
        <div
          style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <BulkGrid companies={data.companies} indicators={data.indicators} locked={locked} />
        </div>
      </div>

      {/* 포트폴리오 일괄 입력 모달 */}
      <Modal
        open={portfolioOpen}
        onCancel={() => setPortfolioOpen(false)}
        onOk={applyPortfolio}
        okText="조회"
        cancelText="취소"
        title="포트폴리오 일괄 조회"
        centered
      >
        <p style={{ fontSize: 13, color: colors.textSub, marginTop: 0 }}>
          종목코드(6자리)를 줄바꿈·쉼표로 구분해 붙여넣으세요.
        </p>
        <Input.TextArea
          rows={6}
          value={portfolioText}
          onChange={(e) => setPortfolioText(e.target.value)}
          placeholder={"005930\n000660\n035420"}
        />
      </Modal>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </main>
  );
}
