"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AuthButtonProps {
  isAuthenticated: boolean;
}

export default function AuthButton({ isAuthenticated }: AuthButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="text-xs px-3 py-1 rounded-lg font-medium"
        style={{
          color: "var(--accent)",
          border: "1px solid var(--accent)",
        }}
      >
        ログイン
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs px-3 py-1 rounded-lg"
        style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        ログアウト
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-xs flex flex-col gap-4"
            style={{ background: "var(--surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center font-medium" style={{ color: "var(--text)" }}>
              ログアウトしますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                いいえ
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "#ef4444" }}
              >
                はい
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
