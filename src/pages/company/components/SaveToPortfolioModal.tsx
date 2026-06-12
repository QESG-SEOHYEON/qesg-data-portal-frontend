// 관심 기업 저장 — 어느 기업리스트(폴더)에 담을지 선택 + 신규 폴더 생성 + 비슷한 업종 추천.
// 비회원은 진입 전 로그인 모달로 차단(호출부에서). 개인회원(플랜X)도 기본 폴더 "내 관심 포트폴리오" 보유.
import { useEffect, useMemo, useState } from "react";
import { Modal, Input, Button, App } from "antd";
import { FolderOpenOutlined, PlusOutlined, CheckOutlined } from "@ant-design/icons";
import { BULK_COMPANIES } from "@/mock/bulkData";
import { getPortfolios, savePortfolio, addCompanyToPortfolio } from "@/mock/workspace";
import type { Portfolio } from "@/mock/workspace";
import { colors, sectorTone } from "@/theme/tokens";

export function SaveToPortfolioModal({
  open,
  onClose,
  company,
}: {
  open: boolean;
  onClose: () => void;
  company: { id: string; name: string; sector: string };
}) {
  const { message } = App.useApp();
  const [folders, setFolders] = useState<Portfolio[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [recs, setRecs] = useState<Set<string>>(new Set());

  // 열릴 때마다 폴더 새로 읽기 + 기본 선택(첫 폴더 = "내 관심 포트폴리오")
  useEffect(() => {
    if (!open) return;
    const list = getPortfolios();
    setFolders(list);
    setSelected(list[0]?.id ?? "");
    setNewName("");
    setRecs(new Set());
  }, [open, company.id]);

  // 비슷한 업종 추천 — 같은 sector, 본인 제외
  const recommendations = useMemo(
    () =>
      BULK_COMPANIES.filter((c) => c.sector === company.sector && c.id !== company.id).slice(0, 4),
    [company.id, company.sector],
  );

  const createFolder = () => {
    const name = newName.trim();
    if (!name) return;
    const pf = savePortfolio(name, []);
    setNewName("");
    setFolders(getPortfolios());
    setSelected(pf.id);
    message.success(`'${name}' 폴더를 만들었어요`);
  };

  const toggleRec = (id: string) =>
    setRecs((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const doSave = () => {
    if (!selected) return;
    addCompanyToPortfolio(selected, company.id);
    recs.forEach((rid) => addCompanyToPortfolio(selected, rid));
    const folderName = folders.find((f) => f.id === selected)?.name ?? "";
    message.success(`'${folderName}'에 저장했어요${recs.size ? ` (+${recs.size}곳)` : ""}`);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={doSave}
      okText="저장"
      cancelText="닫기"
      title="관심 기업 저장"
      centered
      width={460}
    >
      <div style={{ fontSize: 13, color: colors.textSub, marginBottom: 12 }}>
        <b style={{ color: colors.textBase }}>{company.name}</b>을(를) 어느 기업리스트에 담을까요?
      </div>

      {/* 폴더 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {folders.map((f) => {
          const on = selected === f.id;
          const already = f.companyIds.includes(company.id);
          return (
            <button
              key={f.id}
              onClick={() => setSelected(f.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                border: `1px solid ${on ? colors.accent : colors.border}`,
                background: on ? `${colors.accent}10` : colors.bgSurface,
                borderRadius: 10,
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <FolderOpenOutlined style={{ color: colors.accent }} />
              <span style={{ fontSize: 13.5, fontWeight: 600, color: colors.textBase }}>{f.name}</span>
              <span style={{ fontSize: 12, color: colors.textSub }}>{f.companyIds.length}곳</span>
              {already ? (
                <span style={{ marginLeft: "auto", fontSize: 11.5, color: colors.accent, fontWeight: 600 }}>
                  담김
                </span>
              ) : (
                on && <CheckOutlined style={{ marginLeft: "auto", color: colors.accent }} />
              )}
            </button>
          );
        })}
      </div>

      {/* 새 폴더 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Input
          placeholder="새 기업리스트 이름"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={createFolder}
        />
        <Button icon={<PlusOutlined />} onClick={createFolder}>
          만들기
        </Button>
      </div>

      {/* 비슷한 업종 추천 */}
      {recommendations.length > 0 && (
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: colors.textSub,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: sectorTone(company.sector).fg,
                background: sectorTone(company.sector).bg,
                padding: "2px 9px",
                borderRadius: 6,
              }}
            >
              {company.sector}
            </span>
            분야 기업을 함께 담아보세요.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {recommendations.map((c) => {
              const on = recs.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleRec(c.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12.5,
                    border: `1px solid ${on ? colors.accent : colors.border}`,
                    background: on ? `${colors.accent}10` : colors.bgSurface,
                    color: on ? colors.accent : colors.textSub,
                    borderRadius: 16,
                    padding: "5px 12px",
                    cursor: "pointer",
                  }}
                >
                  {on ? <CheckOutlined style={{ fontSize: 11 }} /> : <PlusOutlined style={{ fontSize: 11 }} />}
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
