// SignupCTA (랜딩 명세 2.6) — 가입 유도. 회원 유형 분기는 힌트만.
import { Button } from "antd";
import { getCoverageStats } from "@/mock/landing";
import { colors } from "@/theme/tokens";

export function SignupCTA() {
  const total = getCoverageStats().indicators;
  return (
    <section style={{ padding: "20px 20px 80px" }}>
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          background: colors.primary,
          borderRadius: 16,
          padding: "44px 32px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff" }}>
          전체 {total}개 지표와 기업별 상세 데이터는 가입 후 이용할 수 있습니다
        </h2>
        <p style={{ margin: "10px 0 24px", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
          개인 회원은 단건 상세를, 기업 회원은 대량 조회·Excel·API까지 이용할 수 있습니다
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
          // TODO: 가입 동선 (후속)
          onClick={() => console.log("signup")}
        >
          가입하고 전체 데이터 보기
        </Button>
      </div>
    </section>
  );
}
