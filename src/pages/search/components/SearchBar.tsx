// 검색 바 (명세 2, 4.1, 4.2) — ScopeSelect + SearchInput + ClearButton
import { Input, Select } from "antd";
import { CloseCircleFilled, SearchOutlined } from "@ant-design/icons";
import type { SearchScope } from "@/types";
import { colors, radius, layout } from "@/theme/tokens";

interface Props {
  query: string;
  scope: SearchScope;
  onQueryChange: (value: string) => void;
  onScopeChange: (scope: SearchScope) => void;
  onFocus?: () => void;
  onClear: () => void;
  onSubmit?: () => void;
}

const SCOPE_OPTIONS: { value: SearchScope; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "company", label: "기업" },
  { value: "indicator", label: "지표" },
];

export function SearchBar({
  query,
  scope,
  onQueryChange,
  onScopeChange,
  onFocus,
  onClear,
  onSubmit,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: layout.searchBarHeight,
        background: colors.bgSurface,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        overflow: "hidden",
      }}
    >
      {/* 검색조건 드롭다운 (scope) — 기본값 all */}
      <Select
        value={scope}
        onChange={onScopeChange}
        options={SCOPE_OPTIONS}
        variant="borderless"
        style={{ width: 92, height: "100%" }}
        styles={{ popup: { root: { minWidth: 92 } } }}
      />
      <div style={{ width: 1, background: colors.border, margin: "8px 0" }} />

      {/* 텍스트 입력 */}
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={onFocus}
        onPressEnter={onSubmit}
        placeholder="기업명 · 종목코드 또는 지표를 검색하세요"
        variant="borderless"
        prefix={<SearchOutlined style={{ color: colors.textHint, fontSize: 16 }} />}
        // 입력 있을 때만 클리어 버튼 노출 (명세 2)
        suffix={
          query ? (
            <CloseCircleFilled
              onClick={onClear}
              style={{ color: colors.textHint, cursor: "pointer", fontSize: 14 }}
            />
          ) : (
            <span style={{ width: 14 }} />
          )
        }
        style={{ flex: 1, fontSize: 15 }}
      />
    </div>
  );
}
