// 개별 기업 ESG 상세 (개정 명세)
// 헤더 → ESG 다타입 테이블(추이 아코디언) → AI 질의 → 공시원문 → 유사기업
// 잠금은 플랜 셀렉터(access.ts tier). 평가·등급·전망 없음.
// ⚠️ 출처(데이터 소스) 표시는 사내 정책 확정 전까지 화면에서 끔 — 데이터/TrustBlock 컴포넌트는 유지, 렌더만 생략.
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Segmented, Button, Empty } from "antd";
import { ArrowLeftOutlined, HeartOutlined } from "@ant-design/icons";
import type { Category, ViewerPlan } from "@/types";
import { getCompanyDetail } from "@/mock/companyDetail";
import { PLAN_LABELS } from "@/mock/access";
import { colors, categoryColors, layout } from "@/theme/tokens";
import { EsgIndicatorTable } from "./components/EsgIndicatorTable";
import { AskAboutCompany } from "./components/AskAboutCompany";
import { DisclosureSources } from "./components/DisclosureSources";
import { SimilarCompanies } from "./components/SimilarCompanies";

const CATEGORIES: Category[] = ["E", "S", "G"];
const PLANS: ViewerPlan[] = ["guest", "member", "enterprise"];

export function CompanyDetailPage() {
  const { companyId = "" } = useParams();
  const [plan, setPlan] = useState<ViewerPlan>("member");
  const [tab, setTab] = useState<Category>("E");

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

  return (
    <Page>
      <Link to="/" style={{ fontSize: 13, color: colors.textSub, display: "inline-flex", gap: 6, alignItems: "center" }}>
        <ArrowLeftOutlined /> 검색
      </Link>

      {/* ── 헤더 ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, margin: "12px 0 20px", flexWrap: "wrap" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: colors.primary,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {detail.name.slice(0, 2)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: colors.textBase }}>{detail.name}</h1>
            <span style={{ fontSize: 14, color: colors.textSub, fontVariantNumeric: "tabular-nums" }}>{detail.id}</span>
          </div>
          <div style={{ fontSize: 12.5, color: colors.textHint, marginTop: 4 }}>
            {detail.industry} · {detail.market} · {detail.size} · 결산 {detail.fiscalMonth}
          </div>
        </div>
        <Button icon={<HeartOutlined />} onClick={() => console.log("save-company")}>
          관심기업 저장
        </Button>
      </div>

      {/* 플랜 셀렉터 (잠금 데모) */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <span style={{ fontSize: 13, color: colors.textSub }}>조회 플랜</span>
        <Segmented
          size="small"
          value={plan}
          onChange={(v) => setPlan(v as ViewerPlan)}
          options={PLANS.map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
        />
      </div>

      {/* ── ESG 데이터 (다타입 테이블) ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
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
              {meta.name} {c}
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

      <div style={{ background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: "4px 14px" }}>
        <EsgIndicatorTable
          rows={detail.indicators[tab]}
          trend={detail.trend}
          onCompare={(l) => console.log("indicator compare →", l)}
        />
      </div>
      <div style={{ marginTop: 10, fontSize: 11.5, color: colors.textHint }}>
        0값은 미공개로 처리됩니다. 공시 연도는 {detail.baseYear}년 기준입니다.
      </div>

      {/* ── AI 질의 ── */}
      <AskAboutCompany detail={detail} />

      {/* ── 공시 원문 ── */}
      <DisclosureSources detail={detail} />

      {/* ── 유사 기업 ── */}
      <SimilarCompanies detail={detail} />
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", padding: "32px 20px 80px" }}>{children}</div>
    </main>
  );
}
