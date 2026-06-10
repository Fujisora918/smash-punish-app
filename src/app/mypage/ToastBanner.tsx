"use client";

import { useEffect, useState } from "react";

interface Props {
  message: string;
  type: "ok" | "err";
  onDone: () => void;
}

export default function ToastBanner({ message, type, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 2000);
    const t2 = setTimeout(() => onDone(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const style = type === "ok"
    ? { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--green)" }
    : { background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--red)" };

  return (
    <div
      className="rounded-xl px-4 py-3 text-sm font-medium text-center transition-opacity duration-400"
      style={{ ...style, opacity: visible ? 1 : 0 }}
    >
      {message}
    </div>
  );
}
