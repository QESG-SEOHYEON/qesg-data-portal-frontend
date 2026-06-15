// 요금제 / 서비스 소개 (대충 구현 — 추후 실제 플랜·결제 연동)
// GNB "요금제" + 워크스페이스 진입 잠금의 "서비스 소개" 버튼이 이 페이지로 연결됨.
import { useNavigate } from "react-router";
import { Button } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { colors, layout } from "@/theme/tokens";

interface Tier {
  name: string;
  price: string;
  desc: string;
  features: string[];
  highlight?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "비회원",
    price: "무료",
    desc: "비회원",
    features: ["카테고리당 상위 지표 미리보기", "기업 페이지 일부 열람"],
  },
  {
    name: "개인 회원",
    price: "무료",
    desc: "로그인 후 바로 이용",
    features: ["전체 지표 값 열람", "기업 상세·제재 내역 전체", "AI 질의 1일 1회"],
  },
  {
    name: "개인 플랜",
    price: "월간/연간 구독",
    desc: "개인 분석가용",
    features: ["데이터 조회 무제한", "워크스페이스 + AI 분석 무제한", "저장 · Excel 다운로드"],
    highlight: true,
  },
  {
    name: "기업 플랜",
    price: "문의",
    desc: "팀·기관용",
    features: ["개인 플랜 전체 기능", "API 연동", "대량·포트폴리오 일괄 처리"],
  },
];

export function PricingPage() {
  const navigate = useNavigate();
  return (
    <main style={{ minHeight: "100vh", background: colors.bgPage }}>
      <div
        style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", padding: "56px 20px 80px" }}
      >
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: colors.textBase }}>
            서비스 소개
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 15, color: colors.textSub, lineHeight: 1.6 }}>
            큐뎁 서비스 소개 및 플랜별 소개 페이지
            <br />
          </p>
        </div>

        {/* 플랜 카드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          {TIERS.map((t) => (
            <div
              key={t.name}
              style={{
                background: colors.bgSurface,
                border: `1.5px solid ${t.highlight ? colors.accent : colors.border}`,
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                boxShadow: t.highlight ? `0 8px 24px ${colors.accent}22` : undefined,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: colors.textBase }}>
                    {t.name}
                  </span>
                  {t.highlight && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                        background: colors.accent,
                        padding: "2px 8px",
                        borderRadius: 10,
                      }}
                    >
                      추천
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: colors.textHint, marginTop: 4 }}>{t.desc}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: colors.primary }}>{t.price}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {t.features.map((f) => (
                  <div
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 13.5,
                      color: colors.textBase,
                      lineHeight: 1.5,
                    }}
                  >
                    <CheckOutlined style={{ color: colors.accent, fontSize: 12, marginTop: 3 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <Button
                type={t.highlight ? "primary" : "default"}
                block
                style={
                  t.highlight
                    ? { background: colors.accent, borderColor: colors.accent }
                    : undefined
                }
                onClick={() => navigate(t.price === "문의" ? "/contact?type=plan" : "/")}
              >
                {t.price === "문의" ? "도입 문의" : "시작하기"}
              </Button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 36, fontSize: 12.5, color: colors.textHint }}>
          ※ 본 페이지는 데모용 안내입니다.
        </div>
      </div>
    </main>
  );
}
