// 산업평균 비교 티저 (로그인 유도)
// 기업 원본 수치(공개)는 보여주고, '산업 평균 대비 비교'(가공·검증 = 프리미엄)는 잠금.
// ※ 실제 DB엔 '& 산업평균' 지표가 있어 그대로 구현 가능. 목업은 회사값만 노출.
import { useMemo, useState } from "react";
import { Button } from "antd";
import { LockOutlined } from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getCompanyDetail } from "@/mock/companyDetail";
import { colors } from "@/theme/tokens";
import { LoginModal } from "./LoginModal";
import { Section } from "./Section";

const SAMPLE_ID = "005930"; // 삼성전자
const INDICATOR_ID = "E1"; // 온실가스 배출량 (Scope 1)

export function IndustryAvgTeaser() {
  const [loginOpen, setLoginOpen] = useState(false);

  const { label, unit, data } = useMemo(() => {
    const detail = getCompanyDetail(SAMPLE_ID, "member"); // 회사 원본값은 공개 취급
    const series = detail?.byCategory.E.find((s) => s.indicator.id === INDICATOR_ID);
    return {
      label: series?.indicator.label ?? "온실가스 배출량",
      unit: series?.indicator.unit ?? "",
      data: (series?.points ?? []).map((p) => ({ year: p.fiscalYear, value: p.value ?? 0 })),
    };
  }, []);

  return (
    <Section title="업계 평균과 비교">
      <div
        style={{
          display: "flex",
          gap: 16,
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: 18,
          flexWrap: "wrap",
        }}
      >
        {/* 좌: 기업 원본값 (공개) */}
        <div style={{ flex: "1 1 360px", minWidth: 300 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textBase }}>
            삼성전자 · {label}
          </div>
          <div style={{ fontSize: 12, color: colors.textHint, marginTop: 2, marginBottom: 8 }}>
            단위: {unit} · 공개 공시 기준
          </div>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F4" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: colors.textSub }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: colors.textSub }} tickLine={false} width={52} />
                <RTooltip
                  formatter={(v) => [Number(v).toLocaleString("ko-KR"), label]}
                  labelFormatter={(l) => `${l}년`}
                />
                <Bar dataKey="value" fill={colors.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 우: 산업평균 비교 = 잠금 (프리미엄) */}
        <div
          style={{
            flex: "1 1 280px",
            minWidth: 240,
            border: `1px dashed ${colors.border}`,
            borderRadius: 10,
            background: colors.bgPage,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 20,
            gap: 10,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${colors.accent}1A`,
              color: colors.accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            <LockOutlined />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textBase }}>
            산업 평균 대비 비교는 로그인 후
          </div>
          <div style={{ fontSize: 12.5, color: colors.textSub, lineHeight: 1.6 }}>
            동종업계 평균·백분위와 다개년 추이를 함께 비교해 보세요
          </div>
          <Button type="primary" onClick={() => setLoginOpen(true)} style={{ marginTop: 4 }}>
            로그인하고 비교 보기
          </Button>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Section>
  );
}
