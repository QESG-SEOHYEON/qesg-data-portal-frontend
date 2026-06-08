// 위젯 상단 필드 선택 탭 (드롭다운 대체) — ESG 뉴스 테마 탭과 동일 스타일.
import { colors } from "@/theme/tokens";

interface Option {
  value: string;
  label: string;
}

export function FieldTabs({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 22,
        overflowX: "auto",
        borderBottom: `1px solid ${colors.border}`,
        marginBottom: 16,
      }}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              border: "none",
              background: "transparent",
              padding: "12px 2px",
              fontSize: 15,
              fontWeight: active ? 700 : 500,
              color: active ? colors.textBase : colors.textSub,
              borderBottom: active ? `2px solid ${colors.accent}` : "2px solid transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
