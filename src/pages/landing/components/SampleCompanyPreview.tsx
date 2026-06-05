// 샘플 기업 미리보기 (로그인 유도 teaser)
// 실제 기업 상세를 미니로 노출 — guest 플랜 잠금 그대로 사용.
// 최신연도·공개출처 셀 일부만 공개, 나머지 🔒 → "로그인하고 전체 보기".
import { useState } from "react";
import { Link } from "react-router";
import { Button } from "antd";
import { LockOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { getCompanyDetail } from "@/mock/companyDetail";
import { formatValue } from "@/utils/format";
import { colors } from "@/theme/tokens";
import { SourceBadge } from "@/pages/company/components/SourceBadge";
import { LoginModal } from "./LoginModal";
import { Section } from "./Section";

const SAMPLE_ID = "005930"; // 삼성전자

export function SampleCompanyPreview() {
  const [loginOpen, setLoginOpen] = useState(false);
  const detail = getCompanyDetail(SAMPLE_ID, "guest");
  if (!detail) return null;

  // 카테고리별 2개씩 ≈ 6개 지표 미리보기
  const rows = (["E", "S", "G"] as const).flatMap((c) => detail.byCategory[c].slice(0, 2));

  return (
    <Section title="기업 ESG 데이터 미리보기">
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* 기업 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            padding: "16px 18px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <Link
            to={`/company/${SAMPLE_ID}`}
            style={{ fontSize: 17, fontWeight: 800, color: colors.textBase }}
          >
            {detail.company.label}
          </Link>
          <span style={{ fontSize: 13, color: colors.textSub }}>{detail.company.id}</span>
          <span style={{ fontSize: 12, color: colors.textHint, marginLeft: "auto" }}>
            최신 데이터 기준
          </span>
        </div>

        {/* 지표 행들 */}
        <div>
          {rows.map((s) => {
            const latest = s.points[s.points.length - 1];
            return (
              <div
                key={s.indicator.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 18px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ flex: 1, fontSize: 14, color: colors.textBase }}>
                  {s.indicator.label}
                </span>
                {latest.locked ? (
                  <span style={{ fontSize: 13, color: colors.textHint }}>
                    <LockOutlined /> 회원 전용
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: latest.value === null ? colors.textHint : colors.textBase,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatValue(latest)}
                  </span>
                )}
                <SourceBadge source={latest.source} year={latest.fiscalYear} />
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 18px",
            background: colors.bgPage,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, color: colors.textSub, flex: 1 }}>
            다개년 추이와 전체 {detail.coverage.E + detail.coverage.S + detail.coverage.G}개+ 지표는 로그인 후 확인할 수 있어요
          </span>
          <Link to={`/company/${SAMPLE_ID}`}>
            <Button>상세 페이지 보기</Button>
          </Link>
          <Button type="primary" onClick={() => setLoginOpen(true)}>
            로그인하고 전체 보기 <ArrowRightOutlined />
          </Button>
        </div>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Section>
  );
}
