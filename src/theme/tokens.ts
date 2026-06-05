// QESG 디자인 토큰 (목업 명세 5장 기준 — 디자인 확정 시 조정)
import type { ThemeConfig } from "antd";
import type { Category } from "@/types";

// 1차 컬러 테마 (2026-06-05 확정안 — B안: 차콜 + 틸)
// 브랜드 크롬은 무채색(차콜), 색은 accent 틸 + E/S/G 분류색에만 → 데이터가 화면 주인공.
export const colors = {
  primary: "#233140", // 차콜 네이비 — 헤더·주버튼 (거의 무채색)
  accent: "#0F8A6A", // 틸 — 강조 숫자·가입 버튼·CTA
  accentLight: "#5DA9A0", // 보조 틸 — 밝은 강조
  bgPage: "#F4F6F8", // 페이지 배경 (대안: #F3F5F6)
  bgSurface: "#FFFFFF", // 서피스/카드
  border: "#E5E7EB",
  textBase: "#22303C", // 본문 텍스트
  textSub: "#6B7280", // 보조라벨
  textHint: "#9CA3AF", // placeholder·안내
  rowHover: "#F4F6F8",
};

// E/S/G 카테고리 분류색 (fg = 분류색, bg = 라이트 틴트)
export const categoryColors: Record<Category, { bg: string; fg: string; name: string }> = {
  E: { bg: "#E4F4ED", fg: "#1D9E75", name: "환경" },
  S: { bg: "#E6F1FB", fg: "#2E75B6", name: "사회" },
  G: { bg: "#EDECFB", fg: "#7F77DD", name: "지배구조" },
};

export const radius = {
  sm: 8,
  md: 12, // 검색바·드롭다운
};

export const layout = {
  searchMaxWidth: 620, // 검색 영역 최대 폭 (명세 5.3)
  searchBarHeight: 46,
  dropdownMaxHeight: 340,
  rowHeight: 40,
};

// AntD ConfigProvider 테마
export const qesgTheme: ThemeConfig = {
  token: {
    colorPrimary: colors.primary,
    colorBgLayout: colors.bgPage,
    colorBgContainer: colors.bgSurface,
    colorBorder: colors.border,
    colorText: colors.textBase,
    colorTextSecondary: colors.textSub,
    colorTextPlaceholder: colors.textHint,
    borderRadius: radius.md,
    fontFamily:
      "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕', sans-serif",
  },
};
