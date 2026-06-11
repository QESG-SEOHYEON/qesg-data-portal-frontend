// SignupCTA (랜딩 명세 2.6) — 가입 유도. 회원 유형 분기는 힌트만.
import { Button } from "antd";
import { colors, layout } from "@/theme/tokens";

export function SignupCTA() {
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
          (큐뎁 서비스명)으로 모든 ESG 정보를 확인해보십쇼...
        </h2>
        <p style={{ margin: "10px 0 24px", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
          개인 회원은 단건 상세를, 플랜 회원은 대량 조회·Excel·API까지 이용할 수 있습니다
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
          // TODO: 로그인하면 플랜 페이지으로 이어지게 해야지
          onClick={() => console.log("signup")}
        >
          로그인하기
        </Button>
      </div>
    </section>
  );
}
