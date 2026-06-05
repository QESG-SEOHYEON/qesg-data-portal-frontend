// 단건 기업 상세 (기획안 4.2)
// - 상단 E/S/G 탭 + 보유 지표 수 커버리지 뱃지
// - 차트 뷰 / 테이블 뷰 토글 (동일 데이터)
// - 셀 단위 출처·연도 뱃지 (DataTableView / DataChartView 내부)
// - 플랜 셀렉터 → 출처 기준 tier 잠금 데모 (기획안 5.2, access.ts 단일 권한 레이어)
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Segmented, Empty } from "antd";
import { ArrowLeftOutlined, BarChartOutlined, TableOutlined } from "@ant-design/icons";
import type { Category, ViewerPlan } from "@/types";
import { getCompanyDetail } from "@/mock/companyDetail";
import { PLAN_LABELS } from "@/mock/access";
import { colors, categoryColors } from "@/theme/tokens";
import { DataTableView } from "./components/DataTableView";
import { DataChartView } from "./components/DataChartView";

type ViewMode = "table" | "chart";
const CATEGORIES: Category[] = ["E", "S", "G"];
const PLANS: ViewerPlan[] = ["guest", "member", "enterprise"];

export function CompanyDetailPage() {
  const { companyId = "" } = useParams();
  const [plan, setPlan] = useState<ViewerPlan>("member");
  const [tab, setTab] = useState<Category>("E");
  const [view, setView] = useState<ViewMode>("table");

  const detail = useMemo(() => getCompanyDetail(companyId, plan), [companyId, plan]);

  if (!detail) {
    return (
      <Page>
        <Empty description="기업을 찾을 수 없습니다" style={{ marginTop: 80 }}>
          <Link to="/">검색으로 돌아가기</Link>
        </Empty>
      </Page>
    );
  }

  const activeSeries = detail.byCategory[tab];

  return (
    <Page>
      {/* 상단: 뒤로 + 기업명 */}
      <div style={{ marginBottom: 20 }}>
        <Link
          to="/"
          style={{ fontSize: 13, color: colors.textSub, display: "inline-flex", gap: 6, alignItems: "center" }}
        >
          <ArrowLeftOutlined /> 검색
        </Link>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: colors.textBase }}>
            {detail.company.label}
          </h1>
          <span style={{ fontSize: 14, color: colors.textSub, fontVariantNumeric: "tabular-nums" }}>
            {detail.company.id}
          </span>
        </div>
      </div>

      {/* 컨트롤 바: 플랜 셀렉터(잠금 데모) + 뷰 토글 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: colors.textSub }}>조회 플랜</span>
          <Segmented
            size="small"
            value={plan}
            onChange={(v) => setPlan(v as ViewerPlan)}
            options={PLANS.map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
          />
        </div>
        <Segmented
          value={view}
          onChange={(v) => setView(v as ViewMode)}
          options={[
            { value: "table", label: "테이블", icon: <TableOutlined /> },
            { value: "chart", label: "차트", icon: <BarChartOutlined /> },
          ]}
        />
      </div>

      {/* E/S/G 탭 + 커버리지 뱃지 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, borderBottom: `1px solid ${colors.border}` }}>
        {CATEGORIES.map((c) => {
          const meta = categoryColors[c];
          const isActive = tab === c;
          return (
            <button
              key={c}
              onClick={() => setTab(c)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                border: "none",
                borderBottom: `2px solid ${isActive ? meta.fg : "transparent"}`,
                background: "transparent",
                color: isActive ? meta.fg : colors.textSub,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {meta.name}
              <span
                style={{
                  background: isActive ? meta.bg : colors.bgPage,
                  color: isActive ? meta.fg : colors.textSub,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                  borderRadius: 10,
                }}
              >
                {detail.coverage[c]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 본문 */}
      {view === "table" ? (
        <div
          style={{
            background: colors.bgSurface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 4,
          }}
        >
          <DataTableView series={activeSeries} years={detail.years} />
        </div>
      ) : (
        <DataChartView series={activeSeries} />
      )}
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 80px" }}>{children}</div>
    </main>
  );
}
