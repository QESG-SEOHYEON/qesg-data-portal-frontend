// 검색 바 (명세 2, 4.1, 4.2) — SearchInput + ClearButton (scope 드롭다운 제거)
import { Input } from "antd";
import { CloseCircleFilled, SearchOutlined } from "@ant-design/icons";
import { colors, radius, layout } from "@/theme/tokens";

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  onFocus?: () => void;
  onClear: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function SearchBar({ query, onQueryChange, onFocus, onClear, onKeyDown }: Props) {
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
      {/* 텍스트 입력 */}
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder="기업명, 종목코드, 키워드 입력"
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
