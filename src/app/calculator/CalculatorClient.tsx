"use client";

import { useEffect, useState, useMemo } from "react";
import AppShell from "@/components/AppShell";
import DrumRollPicker from "@/components/DrumRollPicker";
import {
  getFrameData,
  calcPunishes,
  getOpponentMoves,
  getPunishMoveName,
  buildFallbackPunishMoves,
  type FrameData,
  type PunishResult,
} from "@/lib/frame-data";

interface Props {
  isAuthenticated: boolean;
  username?: string;
}

export default function CalculatorClient({ isAuthenticated, username }: Props) {
  const [frameData, setFrameData] = useState<FrameData | null>(null);
  const [myChar, setMyChar] = useState("");
  const [oppChar, setOppChar] = useState("");
  const [selectedMove, setSelectedMove] = useState("");
  const [guardSide, setGuardSide] = useState<"front" | "back">("front");
  const [charSearch, setCharSearch] = useState("");
  const [oppSearch, setOppSearch] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    getFrameData().then(setFrameData);
  }, []);

  const fighters = frameData?.fighters ?? [];

  const filteredMyChars = useMemo(() =>
    fighters.filter((f) => f.name_jp.includes(charSearch) || f.name_en.toLowerCase().includes(charSearch.toLowerCase())),
    [fighters, charSearch]
  );

  const filteredOppChars = useMemo(() =>
    fighters.filter((f) => f.name_jp.includes(oppSearch) || f.name_en.toLowerCase().includes(oppSearch.toLowerCase())),
    [fighters, oppSearch]
  );

  const oppMoves = useMemo(() => {
    if (!frameData || !oppChar) return [];
    return getOpponentMoves(frameData, oppChar);
  }, [frameData, oppChar]);

  const results: PunishResult[] = useMemo(() => {
    if (!frameData || !myChar || !selectedMove || !oppChar) return [];
    const move = oppMoves.find((m) => m.name === selectedMove);
    if (!move || move.shield_adv === null) return [];

    const punishName = getPunishMoveName(myChar);
    const punishMoves =
      (guardSide === "front"
        ? frameData.punish_moves_front[punishName]
        : frameData.punish_moves_back[punishName])
      ?? buildFallbackPunishMoves(frameData, myChar);

    return calcPunishes(move, punishMoves);
  }, [frameData, myChar, oppChar, selectedMove, guardSide, oppMoves]);

  const selectedMoveData = oppMoves.find((m) => m.name === selectedMove);

  if (!frameData) {
    return (
      <AppShell title="確定反撃計算機" isAuthenticated={isAuthenticated} username={username}>
        <div className="flex items-center justify-center h-40">
          <p style={{ color: "var(--text-muted)" }}>データ読み込み中...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="確定反撃計算機" isAuthenticated={isAuthenticated} username={username}>
      <div className="px-4 py-4 flex flex-col gap-5">

        {/* Step 1: キャラ選択 */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
            STEP 1 — キャラ選択
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* 自キャラ */}
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>自分のキャラ</p>
              <input
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                placeholder="検索..."
                className="w-full px-3 py-2 rounded-lg text-sm mb-1"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", outline: "none" }}
              />
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", maxHeight: "180px", overflowY: "auto" }}>
                {filteredMyChars.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setMyChar(f.name_jp); setCharSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{
                      background: myChar === f.name_jp ? "var(--accent)" : "var(--surface)",
                      color: myChar === f.name_jp ? "#fff" : "var(--text)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {f.name_jp}
                  </button>
                ))}
              </div>
            </div>

            {/* 相手キャラ */}
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>相手のキャラ</p>
              <input
                value={oppSearch}
                onChange={(e) => setOppSearch(e.target.value)}
                placeholder="検索..."
                className="w-full px-3 py-2 rounded-lg text-sm mb-1"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", outline: "none" }}
              />
              <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", maxHeight: "180px", overflowY: "auto" }}>
                {filteredOppChars.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setOppChar(f.name_jp); setSelectedMove(""); setOppSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm transition-colors"
                    style={{
                      background: oppChar === f.name_jp ? "var(--accent)" : "var(--surface)",
                      color: oppChar === f.name_jp ? "#fff" : "var(--text)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {f.name_jp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {myChar && oppChar && (
            <div className="mt-2 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: "var(--accent)" }}>{myChar}</span> vs <span style={{ color: "#e88" }}>{oppChar}</span>
            </div>
          )}
        </section>

        {/* Step 2: 相手の技選択 */}
        {oppChar && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              STEP 2 — 相手の技を選択してください ({oppChar})
            </h2>
            {oppMoves.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>このキャラのデータがありません</p>
            ) : (
              <DrumRollPicker
                items={oppMoves.map((m) => ({
                  value: m.name,
                  label: m.name,
                }))}
                value={selectedMove}
                onChange={setSelectedMove}
              />
            )}
          </section>
        )}

        {/* Step 3: ガード方向 + 結果 */}
        {selectedMove && myChar && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
              STEP 3 — ガード方向
            </h2>

            {/* ガード方向トグル */}
            <div className="flex rounded-xl overflow-hidden border mb-4" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setGuardSide("front")}
                className="flex-1 py-2 text-sm font-semibold transition-colors"
                style={{
                  background: guardSide === "front" ? "var(--accent)" : "var(--surface)",
                  color: guardSide === "front" ? "#fff" : "var(--text-muted)",
                }}
              >
                前面ガード
              </button>
              <button
                onClick={() => setGuardSide("back")}
                className="flex-1 py-2 text-sm font-semibold transition-colors"
                style={{
                  background: guardSide === "back" ? "var(--accent)" : "var(--surface)",
                  color: guardSide === "back" ? "#fff" : "var(--text-muted)",
                }}
              >
                背面ガード
              </button>
            </div>

            {/* 結果ヘッダー */}
            <div className="mb-3 px-1 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {oppChar} の <span style={{ color: "var(--accent)" }}>{selectedMove}</span> を
                  {guardSide === "front" ? "前面" : "背面"}ガード時
                </p>
                {selectedMoveData && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    硬直差:{" "}
                    <span
                      className="font-bold"
                      style={{
                        color:
                          selectedMoveData.shield_adv !== null && selectedMoveData.shield_adv > 0
                            ? "var(--red)"
                            : "var(--green)",
                      }}
                    >
                      {selectedMoveData.shield_adv !== null ? selectedMoveData.shield_adv : "不明"}F
                    </span>
                  </p>
                )}
              </div>
              {results.length > 0 && (
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full"
                  style={{ background: "rgba(34,197,94,0.15)", color: "var(--green)" }}
                >
                  確定 {results.filter((r) => r.confirmed).length}技
                </span>
              )}
            </div>

            {/* 確反結果リスト */}
            {results.length === 0 ? (
              <div className="rounded-xl p-4 text-center text-sm" style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                <p>データがありません</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="grid grid-cols-3 gap-1 text-xs mb-1 px-1" style={{ color: "var(--text-muted)" }}>
                  <span>技名</span>
                  <span className="text-right">発生F</span>
                  <span className="text-right">反確</span>
                </div>
                {results.map((r) => (
                  <div
                    key={r.moveName}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                    style={{
                      background: r.confirmed
                        ? "rgba(34, 197, 94, 0.12)"
                        : "rgba(239, 68, 68, 0.10)",
                      border: `1px solid ${r.confirmed ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.25)"}`,
                    }}
                  >
                    <span
                      className="font-semibold text-sm"
                      style={{ color: r.confirmed ? "var(--green)" : "var(--red)" }}
                    >
                      {r.moveName}
                    </span>
                    <div className="flex gap-4 text-sm">
                      <span style={{ color: "var(--text-muted)" }}>{r.startup}F</span>
                      <span
                        className="font-bold w-10 text-right"
                        style={{ color: r.confirmed ? "var(--green)" : "var(--red)" }}
                      >
                        {r.margin === null ? "—" : r.margin >= 0 ? `+${r.margin}` : r.margin}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
