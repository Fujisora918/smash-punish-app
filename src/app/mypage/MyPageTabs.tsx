"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import PasswordField from "./PasswordField";
import MyQRCode from "./MyQRCode";
import type { QRPayload } from "@/lib/types";

type Tab = "account" | "qr";

interface AccountInfo {
  username: string;
  email: string;
}

interface Props {
  account: AccountInfo;
  qrPayload: QRPayload;
  hasFriendCode: boolean;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "account", label: "アカウント" },
  { key: "qr", label: "QRコード" },
];

export default function MyPageTabs({ account, qrPayload, hasFriendCode }: Props) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "account";
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <div className="flex flex-col">
      {/* タブバー */}
      <div
        className="flex mx-5 mt-5 rounded-xl overflow-hidden"
        style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
      >
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="flex-1 py-2.5 text-xs font-semibold transition-colors"
            style={
              tab === key
                ? { background: "var(--accent)", color: "#fff" }
                : { color: "var(--text-muted)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* アカウントタブ */}
      {tab === "account" && (
        <div className="px-5 py-6">
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div
              className="px-4 py-4 flex flex-col gap-1"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>ユーザー名</p>
              <p className="text-sm font-semibold">{account.username || "未設定"}</p>
            </div>
            <div
              className="px-4 py-4 flex flex-col gap-1"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>メールアドレス</p>
              <p className="text-sm font-semibold">{account.email}</p>
            </div>
            <PasswordField />
          </div>
        </div>
      )}

      {/* QRコードタブ */}
      {tab === "qr" && (
        hasFriendCode ? (
          <MyQRCode payload={qrPayload} />
        ) : (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            フレンドコードがまだ生成されていません
          </div>
        )
      )}
    </div>
  );
}
