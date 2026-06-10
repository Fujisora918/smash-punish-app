"use client";

import { useEffect, useRef, useState } from "react";
import type { QRPayload } from "@/lib/types";

type Status = "requesting" | "scanning" | "denied";

interface Props {
  onResult: (payload: QRPayload) => void;
  onClose: () => void;
  onDenied?: () => void;
}

export default function QRScanner({ onResult, onClose, onDenied }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("requesting");
  const [parseErr, setParseErr] = useState("");

  useEffect(() => {
    let stopped = false;
    let controls: { stop: () => void } | null = null;

    async function start() {
      const { BrowserQRCodeReader } = await import("@zxing/browser");

      if (stopped || !videoRef.current) return;

      const reader = new BrowserQRCodeReader();

      try {
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result, err) => {
            if (stopped) return;
            if (result) {
              try {
                const payload = JSON.parse(result.getText()) as QRPayload;
                if (payload.friend_code && payload.username) {
                  onResult(payload);
                } else {
                  setParseErr("このQRコードはフレンドコードではありません");
                }
              } catch {
                setParseErr("QRコードの読み取りに失敗しました");
              }
            }
          }
        );
        if (!stopped) setStatus("scanning");
      } catch {
        if (!stopped) {
          setStatus("denied");
          onDenied?.();
        }
      }
    }

    start();

    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [onResult, onDenied]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* カメラビュー */}
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "#000", aspectRatio: "1/1" }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* リクエスト中オーバーレイ */}
        {status === "requesting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: "rgba(0,0,0,0.7)" }}>
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "rgba(255,255,255,0.6)", borderTopColor: "transparent" }}
            />
            <p className="text-sm text-white/70">カメラを起動中…</p>
          </div>
        )}

        {/* 拒否オーバーレイ */}
        {status === "denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ background: "rgba(0,0,0,0.85)" }}>
            <span className="text-3xl">🚫</span>
            <p className="text-sm font-semibold text-white">カメラへのアクセスが拒否されました</p>
            <p className="text-xs text-white/60">ブラウザの設定でカメラ許可を有効にしてください</p>
          </div>
        )}

        {/* スキャン枠（スキャン中のみ） */}
        {status === "scanning" && (
          <>
            {/* 暗いオーバーレイ（枠の外側） */}
            <div className="absolute inset-0 pointer-events-none">
              {/* 上 */}
              <div className="absolute inset-x-0 top-0 h-[20%]" style={{ background: "rgba(0,0,0,0.45)" }} />
              {/* 下 */}
              <div className="absolute inset-x-0 bottom-0 h-[20%]" style={{ background: "rgba(0,0,0,0.45)" }} />
              {/* 左 */}
              <div className="absolute left-0 top-[20%] bottom-[20%] w-[10%]" style={{ background: "rgba(0,0,0,0.45)" }} />
              {/* 右 */}
              <div className="absolute right-0 top-[20%] bottom-[20%] w-[10%]" style={{ background: "rgba(0,0,0,0.45)" }} />
            </div>

            {/* コーナーマーカー */}
            {[
              "top-[20%] left-[10%] border-t-2 border-l-2 rounded-tl-lg",
              "top-[20%] right-[10%] border-t-2 border-r-2 rounded-tr-lg",
              "bottom-[20%] left-[10%] border-b-2 border-l-2 rounded-bl-lg",
              "bottom-[20%] right-[10%] border-b-2 border-r-2 rounded-br-lg",
            ].map((cls, i) => (
              <div
                key={i}
                className={`absolute w-6 h-6 pointer-events-none ${cls}`}
                style={{ borderColor: "var(--accent)" }}
              />
            ))}

            {/* スキャンライン */}
            <div
              className="absolute left-[10%] right-[10%] h-px pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, var(--accent), transparent)",
                animation: "scanline 2s ease-in-out infinite",
                top: "20%",
              }}
            />
          </>
        )}
      </div>

      {/* エラーメッセージ */}
      {parseErr && (
        <p className="text-xs text-center px-2" style={{ color: "var(--red, #ef4444)" }}>{parseErr}</p>
      )}

      {/* キャンセルボタン */}
      <button
        type="button"
        onClick={onClose}
        className="w-full py-3 rounded-xl text-sm font-semibold"
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        キャンセル
      </button>

      <style>{`
        @keyframes scanline {
          0%   { top: 20%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
