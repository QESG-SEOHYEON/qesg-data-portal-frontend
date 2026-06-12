// 공용 잠금 표현 — "삭제가 아니라 있지만 잠김"(흐림 + 자물쇠 + 유도).
import { LockOutlined } from "@ant-design/icons";
import { colors } from "@/theme/tokens";

// 섹션/영역 잠금: 내용은 흐리게 + 위에 자물쇠·유도 오버레이
export function Locked({
  cta,
  onClick,
  children,
}: {
  cta: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none" }} aria-hidden>
        {children}
      </div>
      <button
        onClick={onClick}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          border: "none",
          background: "rgba(255,255,255,0.45)",
          cursor: onClick ? "pointer" : "default",
          fontSize: 13,
          fontWeight: 600,
          color: colors.primary,
        }}
      >
        <LockOutlined /> {cta}
      </button>
    </div>
  );
}

// 인라인 잠금 칩 (필드/셀 단위) — 흐린 값 위 자물쇠
export function LockChip({ cta, onClick }: { cta: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11.5,
        fontWeight: 600,
        color: colors.primary,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <LockOutlined style={{ fontSize: 11 }} /> {cta}
    </span>
  );
}
