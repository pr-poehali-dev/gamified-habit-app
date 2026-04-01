import { useState, useEffect } from "react";

interface TipCardProps {
  tips: string[];
  storageKey: string;
  /** Цветовая схема: "parent" — синяя, "child" — фиолетово-розовая */
  theme?: "parent" | "child";
}

/**
 * Показывает случайный совет при каждом заходе в приложение.
 * Можно закрыть кнопкой ×. После закрытия не показывается до следующего
 * открытия (session-флаг живёт только в sessionStorage).
 */
export function TipCard({ tips, storageKey, theme = "parent" }: TipCardProps) {
  const [visible, setVisible] = useState(false);
  const [tip, setTip] = useState("");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Проверяем: был ли совет уже закрыт в этой сессии?
    const dismissed = sessionStorage.getItem(storageKey);
    if (dismissed) return;

    // Выбираем случайный совет
    const idx = Math.floor(Math.random() * tips.length);
    setTip(tips[idx]);
    setVisible(true);
  }, []);

  const handleClose = () => {
    setClosing(true);
    sessionStorage.setItem(storageKey, "1");
    setTimeout(() => setVisible(false), 280);
  };

  if (!visible || !tip) return null;

  const isParent = theme === "parent";

  const wrapperClass = isParent
    ? "bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 border border-[#6B7BFF]/20"
    : "bg-gradient-to-r from-[#FF6BB5]/10 to-[#9B6BFF]/10 border border-[#9B6BFF]/20";

  const labelColor = isParent ? "text-[#6B7BFF]" : "text-[#9B6BFF]";

  return (
    <div
      className={`mt-3 rounded-2xl px-4 py-3 flex gap-3 items-start ${wrapperClass}`}
      style={{
        animation: closing
          ? "tipSlideUp 0.28s ease forwards"
          : "tipSlideDown 0.32s ease",
      }}
    >
      <span className="text-xl flex-shrink-0">💡</span>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${labelColor}`}>
          Совет дня
        </p>
        <p className="text-sm text-gray-600 leading-snug">{tip}</p>
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors ml-1 mt-0.5"
        aria-label="Закрыть совет"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M1 1L11 11M11 1L1 11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
