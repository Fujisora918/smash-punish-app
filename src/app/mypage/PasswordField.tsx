"use client";

import { useState } from "react";

export default function PasswordField() {
  const [show, setShow] = useState(false);

  return (
    <div className="px-4 py-4 flex items-center justify-between" style={{ background: "var(--surface)" }}>
      <div className="flex flex-col gap-1">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>パスワード</p>
        <p className="text-sm font-semibold tracking-widest">
          {show ? "Supabase Authで管理されています" : "••••••••"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="text-xs px-3 py-1.5 rounded-lg shrink-0"
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        {show ? "隠す" : "表示"}
      </button>
    </div>
  );
}
