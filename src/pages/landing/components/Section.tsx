// 랜딩 섹션 공통 래퍼 — 제목 + 최대폭 960 중앙 (랜딩 명세 4: 섹션 최대 폭 ~960px)
import { colors } from "@/theme/tokens";

interface Props {
  title?: string;
  /** 제목 우측 부가 정보(예: 최종 갱신일) */
  extra?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, extra, children }: Props) {
  return (
    <section style={{ maxWidth: 960, margin: "0 auto", padding: "44px 20px" }}>
      {(title || extra) && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {title && (
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textBase }}>
              {title}
            </h2>
          )}
          {extra && <span style={{ fontSize: 13, color: colors.textHint }}>{extra}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
