// "원하는 데이터가 보이지 않나요?" — AI 우선(데이터 찾기) + 문의 보조(미수집 데이터 요청)
// AI 워크벤치·문의 페이지 준비 전까지 '준비 중' 토스트로 연결.
import { Button, App } from "antd";
import { useNavigate } from "react-router";
import { colors } from "@/theme/tokens";

export function DataNotFoundCta({ compact = false, query }: { compact?: boolean; query?: string }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        flexWrap: "wrap",
        padding: compact ? "12px 14px" : "16px",
        marginTop: 14,
        background: colors.bgPage,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
      }}
    >
      <span style={{ fontSize: 13, color: colors.textSub }}>원하는 데이터가 보이지 않나요?</span>
      <Button
        type="primary"
        size="small"
        style={{ background: colors.accent, borderColor: colors.accent }}
        onClick={() =>
          navigate(query ? `/workspace?ai=${encodeURIComponent(query)}` : "/workspace")
        }
      >
        ✦ AI에게 물어보기
      </Button>
      <span
        style={{ fontSize: 12.5, color: colors.textSub, cursor: "pointer" }}
        onClick={() => message.info("준비 중입니다")}
      >
        혹은 <span style={{ textDecoration: "underline" }}>데이터 요청하기</span>
      </span>
    </div>
  );
}
