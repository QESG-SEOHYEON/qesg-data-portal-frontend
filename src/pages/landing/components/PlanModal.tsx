// 플랜 가입 유도 모달 — 가입은 했으나 요금 미구매(개인 회원)가 잠긴 기능 접근 시.
import { Modal, Button, App } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { colors } from "@/theme/tokens";

const BENEFITS = [
  "전체 기업 무제한 조회",
  "데이터 다운로드, API 이용 가능",
  "포트폴리오 및 AI 분석",
];

export function PlanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { message } = App.useApp();
  return (
    <Modal open={open} onCancel={onClose} footer={null} centered width={480} title="플랜 가입">
      <div style={{ fontSize: 13.5, color: colors.textSub, lineHeight: 1.6, marginBottom: 16 }}>
        가입 후 (서비스명)의 전체 데이터를 조회할 수 있어요.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {BENEFITS.map((b) => (
          <div
            key={b}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13.5,
              color: colors.textBase,
            }}
          >
            <CheckOutlined style={{ color: colors.accent, fontSize: 13 }} />
            {b}
          </div>
        ))}
      </div>
      <Button
        type="primary"
        block
        style={{ background: colors.accent, borderColor: colors.accent }}
        onClick={() => message.info("준비 중입니다")}
      >
        플랜 보기 / 가입하기
      </Button>
    </Modal>
  );
}
