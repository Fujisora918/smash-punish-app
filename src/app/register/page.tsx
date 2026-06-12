"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  "User already registered": "このメールアドレスはすでに登録されています",
  "email rate limit exceeded": "メール送信の上限に達しました。しばらく時間をおいてから再試行してください",
};

function getErrorMessage(msg: string): string {
  for (const [key, val] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return val;
  }
  return "登録に失敗しました: " + msg;
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (success) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          if (router) {
            // セッションあり(メール認証OFF)ならcalculator、なしならlogin
            router.push(`/login?registered=1&email=${encodeURIComponent(email)}`);
            router.refresh();
          }
        }, 400);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [success, email, router]);

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
      setError(getErrorMessage(error.message));
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (userId) {
      const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      const friendCode = Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const { error: profileErr } = await supabase.from("profiles").upsert(
        { id: userId, username, friend_code: friendCode },
        { onConflict: "id" }
      );
      if (profileErr) {
        console.error("[register] profile upsert failed:", profileErr.message, profileErr.code);
      }
    }

    // セッションあり(メール認証OFF) → そのまま遷移先でログイン状態
    if (data.session) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/calculator");
        router.refresh();
      }, 1900);
      return;
    }

    // セッションなし(メール認証ON) → ログインページへ
    setSuccess(true);
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      {/* 成功トースト */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg"
        style={{
          background: "var(--green, #22c55e)",
          transition: "opacity 400ms ease, transform 200ms ease-out",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-120%)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: "1.1em" }}>✓</span>
        アカウントを作成しました！
      </div>

      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--accent)" }}>
          Punish Note
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          アカウントを作成して始めよう
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
            disabled={loading || success}
            className="w-full py-3 rounded-xl font-semibold text-white transition-opacity"
            style={{ background: "var(--accent)", opacity: loading || success ? 0.6 : 1 }}
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
