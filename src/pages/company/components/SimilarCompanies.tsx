// 유사 기업 — 객관 분류(업종·규모) 기준 카드. 평가 기반 아님. 클릭 시 해당 기업 상세로.
import { useNavigate } from "react-router";
import type { CompanyDetail } from "@/mock/companyDetail";
import { colors } from "@/theme/tokens";

const LOGO_PALETTE = ["#3D5A80", "#0F8A6A", "#185FA5", "#6E5A36", "#534AB7"];

export function SimilarCompanies({ detail }: { detail: CompanyDetail }) {
  const navigate = useNavigate();
  return (
    <section style={{ marginTop: 28 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: colors.textBase }}>유사 기업</h2>
      <div style={{ fontSize: 12.5, color: colors.textHint, marginBottom: 14 }}>
        같은 업종 · 규모 기준 ({detail.industry})
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
        {detail.similar.map((c, i) => (
          <div
            key={c.id}
            onClick={() => navigate(`/company/${c.id}`)}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: colors.bgSurface,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: 14,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: LOGO_PALETTE[i % LOGO_PALETTE.length],
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {c.name.slice(0, 2)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.textBase, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 12, color: colors.textSub }}>{c.id}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
