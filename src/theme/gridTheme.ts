// Glide Data Grid 테마 — 우리 토큰(theme/tokens.ts) 기반
import type { Theme } from "@glideapps/glide-data-grid";
import { colors } from "./tokens";

export const qesgGridTheme: Partial<Theme> = {
  bgCell: colors.bgSurface,
  bgHeader: colors.bgPage,
  bgHeaderHasFocus: "#EDF0F3",
  bgHeaderHovered: "#EDF0F3",
  textDark: colors.textBase,
  textLight: colors.textSub,
  textHeader: colors.textSub,
  accentColor: colors.accent, // 선택 강조 = 틸
  accentFg: "#fff",
  accentLight: "rgba(15,138,106,0.12)",
  bgCellMedium: colors.bgPage,
  borderColor: colors.border,
  fontFamily:
    "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
  baseFontStyle: "13px",
  headerFontStyle: "600 13px",
};
