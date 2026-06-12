import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ThemeToggle from "@/components/ThemeToggle";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const username = user?.user_metadata?.username as string | undefined;

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* ヘッダー */}
      <header className="px-6 pt-14 pb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
            SMASH SP
          </p>
          <ThemeToggle />
        </div>
        <h1 className="text-3xl font-black leading-tight" style={{ color: "var(--text)" }}>
          Punish Note
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          対策メモ・確定反撃計算で上達しよう
        </p>

        {user ? (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              こんにちは、<span className="font-semibold" style={{ color: "var(--text)" }}>{username}</span> さん
            </p>
            <Link
              href="/mypage"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(124,106,247,0.15)", color: "var(--accent)" }}
            >
              マイページ →
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            <Link
              href="/login"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "rgba(124,106,247,0.15)", color: "var(--accent)" }}
            >
              ログイン / 新規登録
            </Link>
          </div>
        )}
      </header>

      {/* メニューカード */}
      <main className="flex-1 px-5 flex flex-col gap-4 justify-center pb-16">

        {/* 確定反撃計算カード */}
        <Link href="/calculator" className="block group">
          <div
            className="rounded-2xl p-5 transition-all active:scale-95"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: "rgba(124,106,247,0.15)" }}
              >
                ⚔️
              </div>
              <span
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ background: "rgba(124,106,247,0.15)", color: "var(--accent)" }}
              >
                全87キャラ対応！
              </span>
            </div>

            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
              確定反撃計算
            </h2>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              相手の技をガードしたとき、どの技が確定するか瞬時に判定。前面・背面ガードに対応。
            </p>

            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "var(--accent)" }}
            >
              <span className="text-sm font-bold text-white">今すぐ計算する</span>
              <span className="text-white font-bold">→</span>
            </div>
          </div>
        </Link>

        {/* 対策メモカード */}
        <Link href="/memos" className="block group">
          <div
            className="rounded-2xl p-5 transition-all active:scale-95"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: "rgba(34,197,94,0.12)" }}
              >
                📝
              </div>
              <span
                className="text-xs font-bold px-2 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-muted)" }}
              >
                ログイン後利用可
              </span>
            </div>

            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>
              キャラ対策メモ
            </h2>
            <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              キャラごとの対策・研究メモを記録・管理。自分だけの戦略ノートをいつでも確認。
            </p>

            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            >
              <span className="text-sm font-bold" style={{ color: "var(--text-muted)" }}>
                メモを見る
              </span>
              <span style={{ color: "var(--text-muted)" }} className="font-bold">→</span>
            </div>
          </div>
        </Link>
      </main>

      {/* フッター */}
      <footer className="px-6 pb-10 text-center">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Ver. 11.0.0 データ対応 · スマブラSP
        </p>
      </footer>
    </div>
  );
}
