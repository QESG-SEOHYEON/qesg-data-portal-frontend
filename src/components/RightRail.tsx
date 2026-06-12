// 오른쪽 레일 (홈·통합검색 공용, 와이드 전용)
// 상단: 최근 조회 이력 / 하단: 플랜별 CTA(비로그인→로그인 유도, 회원→AI 데이터 분석 유도)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Segmented } from "antd";
import { RightOutlined, ClockCircleOutlined } from "@ant-design/icons";
import type { ViewerPlan } from "@/types";
import { getRecentViews, subscribeRecentViews } from "@/mock/recentViews";
import { PLAN_ORDER, PLAN_LABELS } from "@/mock/access";
import { colors } from "@/theme/tokens";

export function RightRail({
  plan,
  onPlanChange,
  onLogin,
}: {
  plan: ViewerPlan;
  onPlanChange?: (p: ViewerPlan) => void;
  onLogin: () => void;
}) {
  const navigate = useNavigate();
  const [recent, setRecent] = useState(getRecentViews);
  // 페이지 진입 시 pushRecentView → 즉시 반영
  useEffect(() => subscribeRecentViews(() => setRecent([...getRecentViews()])), []);
  const isMember = plan !== "guest";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 조회 플랜(회원 등급) 토글 — 데모용 */}
      {onPlanChange && (
        <div style={{ background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colors.textSub, marginBottom: 8 }}>조회 플랜</div>
          <Segmented
            size="small"
            block
            vertical
            value={plan}
            onChange={(v) => onPlanChange(v as ViewerPlan)}
            options={PLAN_ORDER.map((p) => ({ value: p, label: PLAN_LABELS[p] }))}
          />
        </div>
      )}

      {/* 최근 조회 이력 */}
      <div style={{ background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.textBase, marginBottom: 12 }}>최근 조회 이력</div>
        {recent.length === 0 ? (
          <div style={{ fontSize: 12.5, color: colors.textHint, lineHeight: 1.5 }}>
            최근 조회한 기업이 여기에 표시됩니다.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recent.map((r, i) => (
              <button
                key={r.id}
                onClick={() => navigate(`/company/${r.id}`)}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.rowHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  padding: "8px 6px",
                  borderTop: i === 0 ? "none" : `1px solid ${colors.border}`,
                  cursor: "pointer",
                  borderRadius: 6,
                }}
              >
                <ClockCircleOutlined style={{ fontSize: 12, color: colors.textHint, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: colors.textBase, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.name}
                </span>
                <span style={{ fontSize: 11.5, color: colors.textSub, fontVariantNumeric: "tabular-nums" }}>{r.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 플랜별 CTA */}
      {isMember ? (
        <div style={{ background: `${colors.accent}0F`, border: `1px solid ${colors.accent}40`, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ color: colors.accent, fontSize: 15 }}>✦</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textBase }}>AI 데이터 분석</div>
          </div>
          <div style={{ fontSize: 12.5, color: colors.textSub, lineHeight: 1.5, marginBottom: 12 }}>
            자연어로 묻고 표·차트로 답받기. 여러 기업·지표를 한 번에 분석하세요.
          </div>
          <Button type="primary" block style={{ background: colors.accent, borderColor: colors.accent }} onClick={() => navigate("/workspace")}>
            AI로 질의하기 <RightOutlined />
          </Button>
        </div>
      ) : (
        <div style={{ background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textBase }}>로그인하고 더 보기</div>
          <div style={{ fontSize: 12.5, color: colors.textSub, margin: "6px 0 12px", lineHeight: 1.5 }}>
            전체 지표·다개년 데이터와 AI 데이터 분석을 이용하세요.
          </div>
          <Button type="primary" block onClick={onLogin}>
            로그인 / 회원가입
          </Button>
        </div>
      )}
    </div>
  );
}
