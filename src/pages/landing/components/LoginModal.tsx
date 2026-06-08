// 로그인 모달 (2단: 좌 로그인 폼 / 우 가입 혜택)
// ※ 목업 단계: 인증 로직 없음. 입력/버튼은 시각만, 동선은 TODO.
// 컬러는 우리 테마 토큰만 사용(추후 확정).
import { Modal, Input, Button } from "antd";
import { CheckOutlined, CloseOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { colors } from "@/theme/tokens";
import { COMPANIES } from "@/mock/companies";

interface Props {
  open: boolean;
  onClose: () => void;
}

const BENEFITS = [
  { title: "횟수 제한 없이 무료 조회", desc: "국내 상장사 기업 ESG 데이터를 제한 없이 열람" },
  { title: "수치마다 출처·공시연도 표시", desc: "각 데이터가 어디서 왔는지 모두 증빙한 데이터" },
  { title: "전 종목 검색·다개년 비교", desc: "100개 이상 지표를 기업 / 연도별로 찾아보기" },
];

// 로고 클라우드 플레이스홀더 — 실제론 수록 기업 로고. 목업은 색 원 + 이니셜.
const LOGO_PALETTE = ["#2E75B6", "#0F6E56", "#534AB7", "#185FA5", "#6E5A36", "#2E6E63"];
const LOGOS = [
  ...COMPANIES.map((c) => c.label.slice(0, 2)),
  "KB",
  "현대",
  "포스",
  "네이",
  "카카",
  "한화",
].slice(0, 12);

export function LoginModal({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={860}
      styles={{ content: { padding: 0, overflow: "hidden", borderRadius: 16 } }}
    >
      <div style={{ display: "flex", minHeight: 380 }}>
        {/* ── 좌: 로그인 폼 ── */}
        <div style={{ flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: colors.textBase }}>
            로그인
          </h2>
          <p></p>

          <label style={{ fontSize: 13, color: colors.textSub, marginBottom: 6 }}>이메일</label>
          <Input size="large" placeholder="example@qesg.co.kr" style={{ marginBottom: 14 }} />

          <label style={{ fontSize: 13, color: colors.textSub, marginBottom: 6 }}>비밀번호</label>
          <Input.Password size="large" placeholder="비밀번호 입력" style={{ marginBottom: 8 }} />

          <a
            style={{
              fontSize: 12.5,
              color: colors.textSub,
              alignSelf: "flex-end",
              marginBottom: 18,
            }}
            onClick={() => console.log("forgot-password")}
          >
            아이디/비밀번호를 잊으셨나요?
          </a>

          <Button
            type="primary"
            size="large"
            block
            style={{ height: 46, fontWeight: 700 }}
            onClick={() => console.log("login")}
          >
            로그인
          </Button>

          <div
            style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 13,
              color: colors.textSub,
            }}
          >
            처음이신가요?{" "}
            <a
              style={{ color: colors.primary, fontWeight: 600 }}
              onClick={() => console.log("signup")}
            >
              회원가입
            </a>
          </div>
        </div>

        {/* ── 우: 가입 혜택 패널 ── */}
        <div
          style={{
            flex: 1,
            background: colors.bgPage,
            borderLeft: `1px solid ${colors.border}`,
            color: colors.textBase,
            padding: "28px 26px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <CloseOutlined
            onClick={onClose}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              color: colors.textSub,
              cursor: "pointer",
              fontSize: 16,
            }}
          />

          <h3
            style={{
              margin: "0 0 18px",
              fontSize: 16,
              fontWeight: 800,
              color: colors.textBase,
              whiteSpace: "nowrap", // 한 줄 고정 (모달 폭 확대로 수용)
              lineHeight: 1.4,
            }}
          >
            로그인하면 다음 서비스를 이용할 수 있어요.
          </h3>

          {/* 혜택 (위로) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {BENEFITS.map((b) => (
              <div key={b.title} style={{ display: "flex", gap: 10 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: colors.primary,
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <CheckOutlined />
                </span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: colors.textBase }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSub, marginTop: 2 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 로고 클라우드 (아래) + 캡션 */}
          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 12, color: colors.textSub, marginBottom: 8 }}>
              국내 상장사 2,800+ 데이터 보유{" "}
              <span style={{ color: colors.textHint }}>(하단 기업 로고 지나감)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
              {LOGOS.map((t, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: "50%",
                    background: LOGO_PALETTE[i % LOGO_PALETTE.length],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                    opacity: 0.9,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          <a
            onClick={() => console.log("learn-more")}
            style={{
              marginTop: "auto",
              paddingTop: 16,
              fontSize: 13,
              color: colors.primary,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {/* 클릭 시 서비스 플랜 설명 페이지로 전환 예정 */}
            서비스 더 알아보기 <ArrowRightOutlined style={{ fontSize: 11 }} />
          </a>
        </div>
      </div>
    </Modal>
  );
}
