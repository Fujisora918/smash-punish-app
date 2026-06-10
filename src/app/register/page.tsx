"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) {
      setError(error.message === "User already registered"
        ? "このメールアドレスはすでに登録されています"
        : "登録に失敗しました: " + error.message
      );
      setLoading(false);
      return;
    }
    // トリガーが失敗した場合のフォールバック: アプリ側でプロフィールを作成
    const userId = data.user?.id;
    if (userId) {
      const friendCode = Math.random().toString(36).slice(2, 9).toUpperCase();
      await supabase.from("profiles").upsert(
        { id: userId, username, friend_code: friendCode },
        { onConflict: "id", ignoreDuplicates: true }
      );
    }
    router.push("/calculator");
    router.refresh();
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--accent)" }}>
          新規アカウント登録
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          スマブラ確反チェッカーへようこそ
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              ユーザー名（表示名）
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              パスワード（6文字以上）
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
            {loading ? "登録中..." : "アカウント作成"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
