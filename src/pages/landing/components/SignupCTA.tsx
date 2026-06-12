// SignupCTA (랜딩 명세 2.6) — 가입 유도. 회원 유형 분기는 힌트만.
import { useState } from "react";
import { Button } from "antd";
import { usePlan } from "@/mock/planContext";
import { colors, layout } from "@/theme/tokens";
import { LoginModal } from "./LoginModal";
import { PlanModal } from "./PlanModal";

export function SignupCTA() {
  const [plan] = usePlan();
  const [loginOpen, setLoginOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const isGuest = plan === "guest";

  return (
    <section style={{ padding: "20px 20px 80px" }}>
      <div
        style={{
          maxWidth: layout.contentMaxWidth,
          margin: "0 auto",
          background: colors.primary,
          borderRadius: 16,
          padding: "44px 32px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        {/* 로그인하면 요금제 안내 배너로 바뀌게 해야지 */}
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>
          가입 후 기업의 모든 ESG 정보를 확인해보십쇼...
        </h2>
        <p style={{ margin: "10px 0 24px", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
          국내 유일 ESG 데이터 포털 (큐뎁서비스명)의 정보를 이용하십쇼...
        </p>
        <Button
          size="large"
          style={{
            background: colors.accent,
            color: "#fff",
            border: "none",
            fontWeight: 700,
            height: 46,
            padding: "0 28px",
          }}
          // 비회원 → 로그인 모달 / 로그인 상태 → 플랜 안내
          onClick={() => (isGuest ? setLoginOpen(true) : setPlanOpen(true))}
        >
          {isGuest ? "로그인하기" : "플랜 보기"}
        </Button>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <PlanModal open={planOpen} onClose={() => setPlanOpen(false)} />
    </section>
  );
}
