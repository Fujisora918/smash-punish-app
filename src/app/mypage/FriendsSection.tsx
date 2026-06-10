"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { QRPayload } from "@/lib/types";
import ToastBanner from "./ToastBanner";

const QRScanner = dynamic(() => import("./QRScanner"), { ssr: false });

interface FriendItem {
  request_id: string;
  friend_id: string;
  username: string;
  friend_code: string;
}

interface PendingItem {
  request_id: string;
  sender_id: string;
  username: string;
}

interface Props {
  friends: FriendItem[];
  pendingRequests: PendingItem[];
}

// アバター代替: ユーザー名の頭文字
function Avatar({ name }: { name: string }) {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
      style={{ background: "rgba(124,106,247,0.2)", color: "var(--accent)" }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface Toast { message: string; type: "ok" | "err" }

export default function FriendsSection({ friends: initialFriends, pendingRequests: initialPending }: Props) {
  const [friends, setFriends] = useState(initialFriends);
  const [pending, setPending] = useState(initialPending);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "ok" | "err" = "ok") => {
    setToast({ message, type });
  };

  const sendRequest = useCallback(async (friend_code: string) => {
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friend_code }),
    });
    const json = await res.json();
    if (res.ok) {
      showToast(`${json.username} さんにフレンド申請を送りました 🎮`);
    } else {
      showToast(json.error ?? "エラーが発生しました", "err");
    }
  }, []);

  const handleScan = useCallback(async (payload: QRPayload) => {
    setScanning(false);
    await sendRequest(payload.friend_code);
  }, [sendRequest]);

  const handleDenied = useCallback(() => {
    // カメラ拒否時: スキャナーを閉じて手動入力にフォーカス
    setScanning(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await sendRequest(manualCode.trim());
    setManualCode("");
  };

  const respond = async (request_id: string, status: "accepted" | "rejected") => {
    const res = await fetch("/api/friends/respond", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id, status }),
    });
    if (res.ok) {
      setPending((prev) => prev.filter((p) => p.request_id !== request_id));
      if (status === "accepted") {
        showToast("フレンドになりました！🎉");
        window.location.reload();
      } else {
        showToast("申請を拒否しました");
      }
    } else {
      showToast("操作に失敗しました", "err");
    }
  };

  return (
    <div className="flex flex-col gap-6 px-5 py-6">

      {/* トースト通知 */}
      {toast && (
        <ToastBanner
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}

      {/* フレンドを追加 */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          フレンドを追加
        </p>

        {/* QRスキャン */}
        <button
          type="button"
          onClick={() => setScanning((v) => !v)}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: scanning ? "rgba(124,106,247,0.15)" : "var(--accent)",
            color: scanning ? "var(--accent)" : "#fff",
            border: scanning ? "1px solid var(--accent)" : "none",
          }}
        >
          📷 {scanning ? "スキャンをキャンセル" : "QRコードをスキャン"}
        </button>

        {/* カメラプレビュー（インライン展開） */}
        {scanning && (
          <div
            className="rounded-xl overflow-hidden p-4 flex flex-col items-center gap-3"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
          >
            <QRScanner onResult={handleScan} onClose={() => setScanning(false)} onDenied={handleDenied} />
          </div>
        )}

        {/* 区切り */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>または</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        {/* 手動入力 */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            maxLength={7}
            placeholder="コードを入力 (例: AB3XY7Z)"
            className="flex-1 px-4 py-3 rounded-xl text-sm font-mono"
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-xl text-sm font-semibold shrink-0"
            style={{ background: "rgba(124,106,247,0.15)", color: "var(--accent)", border: "1px solid var(--accent)" }}
          >
            申請
          </button>
        </form>
      </div>

      {/* 受信したフレンド申請 */}
      {pending.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              フレンド申請
            </p>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(124,106,247,0.2)", color: "var(--accent)" }}
            >
              {pending.length}
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {pending.map((p, i) => (
              <div
                key={p.request_id}
                className="px-4 py-3 flex items-center gap-3"
                style={{
                  background: "var(--surface)",
                  borderBottom: i < pending.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <Avatar name={p.username} />
                <span className="flex-1 text-sm font-semibold">{p.username}</span>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => respond(p.request_id, "accepted")}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    承認
                  </button>
                  <button
                    onClick={() => respond(p.request_id, "rejected")}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                  >
                    拒否
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* フレンドリスト */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            フレンド
          </p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(124,106,247,0.12)", color: "var(--text-muted)" }}
          >
            {friends.length}
          </span>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {friends.length === 0 ? (
            <div
              className="py-10 flex flex-col items-center gap-2"
              style={{ background: "var(--surface)" }}
            >
              <span className="text-2xl">🎮</span>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>まだフレンドがいません</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>QRコードをスキャンして追加しよう</p>
            </div>
          ) : (
            friends.map((f, i) => (
              <div
                key={f.friend_id}
                className="px-4 py-3 flex items-center gap-3"
                style={{
                  background: "var(--surface)",
                  borderBottom: i < friends.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <Avatar name={f.username} />
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">{f.username}</p>
                  <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>{f.friend_code}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
