"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import type { QRPayload } from "@/lib/types";

interface Props {
  payload: QRPayload;
}

export default function MyQRCode({ payload }: Props) {
  const [copied, setCopied] = useState(false);
  const qrValue = JSON.stringify(payload);

  if (!payload.friend_code) {
    return (
      <div className="flex flex-col items-center gap-4 px-5 py-10 text-center">
        <p className="text-sm font-semibold" style={{ color: "var(--red, #ef4444)" }}>
          フレンドコードが未生成です
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Supabase の SQL Editor で以下を実行してください:
        </p>
        <pre className="text-xs text-left rounded-xl p-3 w-full overflow-x-auto"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}>
          {`CREATE POLICY "Users can insert own profile"\nON profiles FOR INSERT\nWITH CHECK (auth.uid() = id);`}
        </pre>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          実行後、一度ログアウト→ログインしてください
        </p>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload.friend_code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = payload.friend_code;
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      {/* QRコード */}
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-2xl" style={{ background: "#fff" }}>
          <QRCode value={qrValue} size={180} />
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          このQRコードをフレンドに見せてください
        </p>
      </div>

      {/* フレンドコード */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          フレンドコード
        </p>
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
        >
          <span className="font-mono text-lg font-bold tracking-widest" style={{ color: "var(--accent)" }}>
            {payload.friend_code}
          </span>
          <button
            type="button"
            onClick={copy}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
            style={{
              background: copied ? "rgba(34,197,94,0.15)" : "rgba(124,106,247,0.15)",
              color: copied ? "var(--green)" : "var(--accent)",
              border: copied ? "1px solid rgba(34,197,94,0.4)" : "1px solid var(--accent)",
            }}
          >
            {copied ? "コピー済み ✓" : "コピー"}
          </button>
        </div>
      </div>
    </div>
  );
}
