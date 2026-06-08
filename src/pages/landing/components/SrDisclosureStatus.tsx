// 공시 현황 — 서브탭(지속가능경영보고서 / 기업지배구조보고서)
//  - 지속가능경영보고서: 최근 30일 공시 5건 + 원문 링크
//  - 기업지배구조보고서: 모자이크(블러) + 로그인 필요 (티저)
import { useState } from "react";
import { Button } from "antd";
import { CheckCircleFilled, LinkOutlined, RightOutlined, LockOutlined } from "@ant-design/icons";
import { getRecentSrDisclosures } from "@/mock/landing";
import { colors } from "@/theme/tokens";
import { Section } from "./Section";
import { FieldTabs } from "./FieldTabs";
import { LoginModal } from "./LoginModal";

const PREVIEW = 5;
// 보고서 종류 탭 — 지속가능경영보고서만 공개, 나머지는 모자이크(로그인 필요)
const TABS = [
  { value: "sr", label: "지속가능경영보고서", locked: false },
  { value: "cgr", label: "기업지배구조보고서", locked: false },
  { value: "br", label: "사업보고서", locked: false },
  { value: "env", label: "환경정보공개", locked: true },
];

export function SrDisclosureStatus({ embedded = false }: { embedded?: boolean }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [tab, setTab] = useState("sr");
  const rows = getRecentSrDisclosures().slice(0, PREVIEW);
  const current = TABS.find((t) => t.value === tab) ?? TABS[0];

  return (
    <Section
      title="공시 현황"
      extra={
        <span
          style={{ cursor: "pointer", color: colors.primary, fontWeight: 600 }}
          onClick={() => setLoginOpen(true)}
        >
          더 보기 <RightOutlined style={{ fontSize: 11 }} />
        </span>
      }
      embedded={embedded}
    >
      <FieldTabs options={TABS.map((t) => ({ value: t.value, label: t.label }))} value={tab} onChange={setTab} />

      {!current.locked ? (
        <>
          <div
            style={{
              background: colors.bgSurface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {rows.map((r, idx) => (
              <div
                key={r.stockCode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderTop: idx === 0 ? "none" : `1px solid ${colors.border}`,
                }}
              >
                <div style={{ width: 96, flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, color: colors.textBase, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                    {r.disclosedAt}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textHint }}>{r.daysAgo}일 전</div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleFilled style={{ color: colors.accent, fontSize: 13, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: colors.textBase, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.company}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textSub, flexShrink: 0 }}>{r.stockCode}</span>
                </div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12.5, color: colors.primary, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  원문 <LinkOutlined style={{ fontSize: 11 }} />
                </a>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11.5, color: colors.textHint }}>
            최근 30일 공시 기준 · 원문 링크로 직접 확인(파일 다운로드 미제공)
          </div>
        </>
      ) : (
        /* 잠금 보고서 — 모자이크(블러) + 로그인 필요 */
        <div style={{ position: "relative", border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ filter: "blur(5px)", userSelect: "none", pointerEvents: "none", background: colors.bgSurface }}>
            {rows.map((r, idx) => (
              <div
                key={r.stockCode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderTop: idx === 0 ? "none" : `1px solid ${colors.border}`,
                }}
              >
                <div style={{ width: 96, flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, color: colors.textBase, fontWeight: 600 }}>{r.disclosedAt}</div>
                  <div style={{ fontSize: 11, color: colors.textHint }}>{r.daysAgo}일 전</div>
                </div>
                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleFilled style={{ color: colors.accent, fontSize: 13 }} />
                  <span style={{ fontSize: 14, color: colors.textBase, fontWeight: 600 }}>{r.company}</span>
                  <span style={{ fontSize: 12, color: colors.textSub }}>{r.stockCode}</span>
                </div>
                <span style={{ fontSize: 12.5, color: colors.primary, fontWeight: 600 }}>원문</span>
              </div>
            ))}
          </div>
          {/* 로그인 오버레이 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              background: "rgba(244,246,248,0.55)",
              textAlign: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `${colors.accent}1A`,
                color: colors.accent,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              <LockOutlined />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.textBase }}>
              {current.label}는 로그인 후 확인 가능
            </div>
            <Button type="primary" onClick={() => setLoginOpen(true)}>
              로그인하고 보기
            </Button>
          </div>
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Section>
  );
}
