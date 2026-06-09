// TrustBlock — 출처(보고서)별 신뢰. 각 출처가 왜 믿을 만한지(사실) + 원문 링크. 평가 아님.
import { LinkOutlined } from "@ant-design/icons";
import type { CompanyDetail } from "@/mock/companyDetail";
import { colors } from "@/theme/tokens";

const TEAL_BG = "#F2FAF7";

export function TrustBlock({ detail }: { detail: CompanyDetail }) {
  return (
    <div
      style={{
        background: TEAL_BG,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: "16px 18px",
        marginBottom: 24,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: colors.accent, marginBottom: 12 }}>
        출처별 신뢰
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {detail.trustSources.map((t) => (
          <div
            key={t.source}
            style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}
          >
            <span style={{ width: 150, flexShrink: 0, fontSize: 13.5, fontWeight: 700, color: colors.textBase }}>
              {t.source}
              <span style={{ fontSize: 11, color: colors.textHint, fontWeight: 400, marginLeft: 6 }}>
                {t.year}
              </span>
            </span>
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
              {t.trust.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: colors.textSub,
                    background: colors.bgSurface,
                    border: `1px solid ${colors.border}`,
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  {tag}
                </span>
              ))}
            </span>
            <a
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12.5, color: colors.primary, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}
            >
              원문 <LinkOutlined style={{ fontSize: 11 }} />
            </a>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 11.5, color: colors.textHint, lineHeight: 1.5 }}>
        공시 출처·형식 정보입니다. 기준 채택·검증 여부는 사실이며 ESG 성과·평가와 무관합니다.
      </div>
    </div>
  );
}
