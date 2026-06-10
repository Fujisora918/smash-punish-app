"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") ?? "dark";
    setIsDark(saved === "dark");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  // SSR中はサイズだけ確保して非表示（ちらつき防止）
  if (!mounted) return <div style={{ width: 56, height: 28 }} />;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "ライトモードに切替" : "ダークモードに切替"}
      className="relative flex items-center shrink-0"
      style={{
        width: 56,
        height: 28,
        borderRadius: 999,
        border: isDark
          ? "1px solid rgba(124,106,247,0.4)"
          : "1px solid rgba(255,180,0,0.4)",
        background: isDark
          ? "rgba(124,106,247,0.18)"
          : "rgba(255,200,0,0.15)",
        transition: "background 0.2s, border-color 0.2s",
        cursor: "pointer",
        padding: 3,
      }}
    >
      {/* ノブ */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: 999,
          background: isDark ? "var(--accent)" : "#fff",
          boxShadow: isDark
            ? "0 1px 4px rgba(124,106,247,0.4)"
            : "0 1px 4px rgba(0,0,0,0.15)",
          transform: isDark ? "translateX(0)" : "translateX(28px)",
          transition: "transform 0.2s, background 0.2s",
          fontSize: 11,
          lineHeight: 1,
        }}
      >
        {isDark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
