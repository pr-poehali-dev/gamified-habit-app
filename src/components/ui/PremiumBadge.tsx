import { useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  compact?: boolean;
};

export function PremiumBadge({ compact }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
        className={`inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black rounded-full shadow-sm active:scale-95 transition-transform ${
          compact ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"
        }`}
      >
        <span>👑</span>
        <span>Premium</span>
      </button>

      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          onClick={() => setShowModal(false)}
          style={{ animation: "fadeIn 0.2s ease" }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 px-6 py-6 text-center">
              <div className="text-5xl mb-2">👑</div>
              <h2 className="text-white font-black text-xl">Premium</h2>
              <p className="text-white/80 text-sm font-bold mt-1">Разблокируй все возможности</p>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                { emoji: "📸", text: "Задачи с фотоотчётом" },
                { emoji: "📊", text: "Детальная аналитика" },
                { emoji: "👨‍👧‍👦", text: "Несколько детей" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3">
                  <span className="text-2xl">{f.emoji}</span>
                  <span className="text-sm font-bold text-gray-700">{f.text}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <p className="text-center text-xs text-gray-400 mb-4">Скоро! Подписка появится в ближайшем обновлении</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 font-black text-sm active:scale-95 transition-transform"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function PremiumOverlay({ children, isPremium, feature }: { children: React.ReactNode; isPremium: boolean; feature?: string }) {
  if (isPremium) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <PremiumBadge />
      </div>
    </div>
  );
}

export default PremiumBadge;
