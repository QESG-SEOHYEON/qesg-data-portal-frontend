// 가로 무한 스크롤 마퀴 래퍼. children을 두 벌 렌더해 seamless 루프.
import type { CSSProperties, ReactNode } from "react";
import "./marquee.css";

interface Props {
  children: ReactNode;
  /** ltr = 좌→우(콘텐츠가 오른쪽으로 흐름), rtl = 우→좌 */
  direction?: "ltr" | "rtl";
  /** 한 바퀴 소요 시간(초). 클수록 느림 */
  durationSec?: number;
}

export function Marquee({ children, direction = "ltr", durationSec = 40 }: Props) {
  const trackStyle = { "--dur": `${durationSec}s` } as CSSProperties;
  return (
    <div className="qesg-marquee">
      <div className={`qesg-marquee__track qesg-marquee__track--${direction}`} style={trackStyle}>
        <div className="qesg-marquee__half">{children}</div>
        <div className="qesg-marquee__half" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
