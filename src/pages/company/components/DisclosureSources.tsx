// 공시 원문 — 보고서 리스트 + 작성기준 뱃지 + 원문 외부 링크 (파일 다운로드 X)
import { LinkOutlined } from "@ant-design/icons";
import type { CompanyDetail } from "@/mock/companyDetail";
import { colors } from "@/theme/tokens";

export function DisclosureSources({ detail }: { detail: CompanyDetail }) {
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: colors.textBase }}>
        공시 원문
      </h2>
      <div
        style={{
          background: colors.bgSurface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {detail.disclosures.map((d, idx) => (
          <div
            key={d.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 18px",
              borderTop: idx === 0 ? "none" : `1px solid ${colors.border}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.textBase }}>{d.title}</div>
              <div style={{ fontSize: 12, color: colors.textSub, marginTop: 3 }}>{d.meta}</div>
            </div>
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                color: colors.primary,
                fontWeight: 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              원문 <LinkOutlined style={{ fontSize: 11 }} />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
