// 랜딩 섹션 공통 래퍼 — 제목 + 최대폭 중앙 정렬.
// embedded=true면 외곽 래퍼(maxWidth·padding) 없이 제목+본문만 → 가로 짝짓기 그리드 셀에 넣을 때.
import { colors, layout } from "@/theme/tokens";

interface Props {
  title?: string;
  /** 제목 우측 부가 정보(예: 최종 갱신일) */
  extra?: React.ReactNode;
  /** 다른 그리드 안에 박아넣을 때 외곽 섹션 래퍼 제거 */
  embedded?: boolean;
  children: React.ReactNode;
}

export function Section({ title, extra, embedded = false, children }: Props) {
  const header = (title || extra) && (
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
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textBase }}>{title}</h2>
      )}
      {extra && <span style={{ fontSize: 13, color: colors.textHint }}>{extra}</span>}
    </div>
  );

  if (embedded) {
    return (
      <div>
        {header}
        {children}
      </div>
    );
  }

  return (
    <section style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", padding: "44px 20px" }}>
      {header}
      {children}
    </section>
  );
}
