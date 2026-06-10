"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("メールアドレスまたはパスワードが違います");
      setLoading(false);
    } else {
      router.push("/calculator");
      router.refresh();
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--accent)" }}>
          スマブラ確反チェッカー
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          ガチ勢向け確定反撃計算・対策メモ
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                outline: "none",
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm"
                style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm px-1"
                style={{ color: "var(--text-muted)" }}
              >
                {showPassword ? "非表示" : "表示"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "var(--red)" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-opacity"
            style={{ background: "var(--accent)", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          アカウントをお持ちでない方は{" "}
          <Link href="/register" style={{ color: "var(--accent)" }}>
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
