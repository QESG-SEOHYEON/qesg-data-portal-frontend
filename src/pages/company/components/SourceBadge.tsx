// 셀 단위 출처(·연도) 뱃지 — QESG 고유 강점 (기획안 4.2)
// 잠긴 항목도 이 뱃지는 유지된다("데이터가 어디서 왔는지는 보이되 값은 회원만").
import { Tooltip } from "antd";
import type { SourceDef } from "@/types";
import { sourceBadgeColors } from "@/mock/sources";

interface Props {
  source: SourceDef;
  year?: number;
}

export function SourceBadge({ source, year }: Props) {
  const c = sourceBadgeColors[source.code];
  return (
    <Tooltip title={`출처: ${source.label}${year ? ` · ${year}년 기준` : ""}`}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: c.bg,
          color: c.fg,
          fontSize: 10,
          fontWeight: 600,
          lineHeight: 1,
          padding: "2px 5px",
          borderRadius: 4,
          whiteSpace: "nowrap",
        }}
      >
        {source.code}
        {year ? <span style={{ opacity: 0.7 }}>· {String(year).slice(2)}</span> : null}
      </span>
    </Tooltip>
  );
}
