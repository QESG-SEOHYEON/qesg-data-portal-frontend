import React from "react";
import ReactDOM from "react-dom/client";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "antd/dist/reset.css";
import "@glideapps/glide-data-grid/dist/index.css";
import "./index.css";
import App from "./App";

// 새로고침 시 브라우저가 이전 스크롤 위치로 되돌려 깜빡이는 것 방지 — 항상 상단에서 시작
if ("scrollRestoration" in history) history.scrollRestoration = "manual";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
