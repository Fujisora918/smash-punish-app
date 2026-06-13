import Link from "next/link";
import Image from "next/image";

export default function StartPage() {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between overflow-hidden">
      {/* 背景画像 */}
      <Image
        src="/start-bg.png"
        alt="background"
        fill
        style={{ objectFit: "cover", objectPosition: "center" }}
        priority
      />

      {/* オーバーレイ（上下のテキスト部分を少し暗く） */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* 上部：タイトル */}
      <div className="relative z-10 text-center pt-20 px-6">
        <p className="text-xs font-semibold tracking-widest uppercase mb-2 text-purple-300">
          Super Smash Bros.
        </p>
        <h1 className="text-5xl font-black text-white drop-shadow-lg">
          Punish Note
        </h1>
      </div>

      {/* 下部：スタートボタン */}
      <div className="relative z-10 w-full max-w-sm px-6 pb-16">
        <Link
          href="/home"
          className="block w-full text-center font-bold text-lg py-4 rounded-2xl transition-all active:scale-95 shadow-lg"
          style={{ background: "rgba(124,106,247,0.9)", color: "#fff" }}
        >
          今すぐ始める / START
        </Link>
      </div>
    </div>
  );
}
