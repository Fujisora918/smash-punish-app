"use client";

import { useRef, useEffect, useCallback } from "react";

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

interface Item {
  label: string;
  value: string;
}

interface Props {
  items: Item[];
  value: string;
  onChange: (value: string) => void;
}

export default function DrumRollPicker({ items, value, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingByCode = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIndex = items.findIndex((item) => item.value === value);

  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    isScrollingByCode.current = true;
    el.scrollTo({ top: index * ITEM_HEIGHT, behavior });
    setTimeout(() => { isScrollingByCode.current = false; }, 400);
  }, []);

  // 初期位置スクロール
  useEffect(() => {
    if (selectedIndex >= 0) {
      scrollToIndex(selectedIndex, "instant");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // valueが外から変わった場合
  useEffect(() => {
    if (selectedIndex >= 0 && !isScrollingByCode.current) {
      scrollToIndex(selectedIndex);
    }
  }, [value, selectedIndex, scrollToIndex]);

  const handleScroll = () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const rawIndex = el.scrollTop / ITEM_HEIGHT;
      const snappedIndex = Math.round(rawIndex);
      const clamped = Math.max(0, Math.min(snappedIndex, items.length - 1));
      if (items[clamped] && items[clamped].value !== value) {
        onChange(items[clamped].value);
      }
    }, 80);
  };

  return (
    <div
      style={{
        position: "relative",
        height: CONTAINER_HEIGHT,
        overflow: "hidden",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      {/* 選択中ハイライト帯 */}
      <div
        style={{
          position: "absolute",
          top: ITEM_HEIGHT * 2,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          background: "var(--accent)",
          opacity: 0.15,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: ITEM_HEIGHT * 2,
          left: 12,
          right: 12,
          height: ITEM_HEIGHT,
          borderTop: "1.5px solid var(--accent)",
          borderBottom: "1.5px solid var(--accent)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* スクロール本体 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          height: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
          scrollbarWidth: "none",
        }}
        className="drum-roll-scroll"
      >
        {items.map((item, i) => {
          const diff = Math.abs(i - selectedIndex);
          const opacity = diff === 0 ? 1 : diff === 1 ? 0.6 : 0.3;
          const scale = diff === 0 ? 1 : diff === 1 ? 0.92 : 0.84;
          return (
            <div
              key={item.value}
              onClick={() => {
                scrollToIndex(i);
                onChange(item.value);
              }}
              style={{
                height: ITEM_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                scrollSnapAlign: "center",
                cursor: "pointer",
                transition: "opacity 0.15s, transform 0.15s",
                opacity,
                transform: `scale(${scale})`,
                fontSize: diff === 0 ? "15px" : "13px",
                fontWeight: diff === 0 ? 700 : 400,
                color: diff === 0 ? "var(--accent)" : "var(--text)",
                userSelect: "none",
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>

      {/* 上グラデーション */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT * 2,
          background: "linear-gradient(to bottom, var(--surface) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
      {/* 下グラデーション */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT * 2,
          background: "linear-gradient(to top, var(--surface) 0%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      <style>{`
        .drum-roll-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
