// 사이트 하단 푸터 (목업) — 인증·파트너십 + 회사 정보 + 정책 링크
import { colors, layout } from "@/theme/tokens";

const CERTS: { title: string; sub: string; logos: string[] }[] = [
  { title: "ISO/IEC 27001 인증", sub: "정보보안경영시스템", logos: ["/logos/iso27001.png"] },
  {
    title: "국내 유일 IFRS SASB Level 3 & ISSB Standard 라이선스 보유",
    sub: "IFRS Sustainability 파트너십",
    logos: ["/logos/issb_logo.png", "/logos/ifrs_logo.png"],
  },
  { title: "글로벌리포팅이니셔티브(GRI)", sub: "커뮤니티멤버, 소프트웨어 인증 보유", logos: ["/logos/gri.png"] },
  { title: "기후재무공시태스크포스(TCFD)", sub: "서명기관", logos: ["/logos/tcfd.png"] },
  { title: "Accountability", sub: "AA1000 라이선스 파트너십", logos: ["/logos/aa1000_logo.png"] },
];

export function Footer() {
  return (
    <footer style={{ background: colors.bgPage, borderTop: `1px solid ${colors.border}`, marginTop: 24 }}>
      <div style={{ maxWidth: layout.contentMaxWidth, margin: "0 auto", padding: "36px 20px 48px" }}>
        {/* 인증·파트너십 */}
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {CERTS.map((c) => (
            <div key={c.title} style={{ maxWidth: 230 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, height: 34, marginBottom: 8 }}>
                {c.logos.length > 0 ? (
                  c.logos.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      style={{ height: 28, width: "auto", maxWidth: 130, objectFit: "contain" }}
                    />
                  ))
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 28,
                      padding: "0 10px",
                      border: `1px dashed ${colors.border}`,
                      borderRadius: 6,
                      background: colors.bgSurface,
                      color: colors.textHint,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    (로고)
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.textBase, lineHeight: 1.4 }}>
                {c.title}
              </div>
              <div style={{ fontSize: 11.5, color: colors.textSub, marginTop: 3 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${colors.border}`, margin: "28px 0 20px" }} />

        {/* 회사 정보 + 정책 */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <img src="/logos/qesg.svg" alt="QuantifiedESG" style={{ height: 24, width: "auto", display: "block" }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.textBase, marginBottom: 6 }}>
              (주)퀀티파이드이에스지
            </div>
            <div style={{ fontSize: 12, color: colors.textSub, lineHeight: 1.8 }}>
              대표: 배익현 &nbsp;|&nbsp; 사업자등록번호: 349-86-01679
              <br />
              주소: 서울특별시 종로구 새문안로3길 12 (신문로1가, 신문로빌딩), 3층 퀀티파이드이에스지
              <br />
              문의: info@qesg.co.kr
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
            <div style={{ display: "flex", gap: 18 }}>
              <a style={{ fontSize: 13, color: colors.textBase, fontWeight: 600 }} onClick={() => console.log("privacy")}>
                개인정보처리방침
              </a>
              <a style={{ fontSize: 13, color: colors.textBase, fontWeight: 600 }} onClick={() => console.log("terms")}>
                이용약관
              </a>
            </div>
            <div style={{ fontSize: 12, color: colors.textHint }}>
              Copyright © 2026 QuantifiedESG, Inc. All Rights Reserved
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
