import { useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
  isPremiumPaid: boolean;
  trialActive: boolean;
  trialDaysLeft: number;
  trialUsed: boolean;
  onActivateTrial: () => Promise<void>;
};

export function PremiumModal({ open, onClose, isPremium, isPremiumPaid, trialActive, trialDaysLeft, trialUsed, onActivateTrial }: Props) {
  const [activating, setActivating] = useState(false);

  if (!open) return null;

  const handleActivate = async () => {
    setActivating(true);
    await onActivateTrial();
    setActivating(false);
  };

  const features = [
    { emoji: "📸", title: "Фото-задачи", desc: "Требуйте фотоотчёт о выполнении" },
    { emoji: "👨‍👩‍👧‍👦", title: "Несколько детей", desc: "Добавляйте больше одного ребёнка" },
    { emoji: "📊", title: "Аналитика", desc: "Детальная статистика по каждому ребёнку" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} style={{ animation: "fadeIn 0.2s ease" }}>
      <div className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ animation: "slideUp 0.3s ease", maxHeight: "90vh", overflowY: "auto" }}>
        <div className="bg-gradient-to-br from-[#6B7BFF] via-[#9B6BFF] to-[#C46BFF] px-6 py-8 text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm active:scale-90 transition-transform">
            ✕
          </button>
          <div className="text-5xl mb-3">👑</div>
          <h2 className="text-white font-black text-2xl">Premium</h2>
          {trialActive && (
            <div className="mt-2 bg-white/20 rounded-2xl px-4 py-2 inline-block">
              <p className="text-white font-bold text-sm">
                Пробный период: {trialDaysLeft} {trialDaysLeft === 1 ? "день" : trialDaysLeft < 5 ? "дня" : "дней"}
              </p>
            </div>
          )}
          {isPremiumPaid && (
            <div className="mt-2 bg-white/20 rounded-2xl px-4 py-2 inline-block">
              <p className="text-white font-bold text-sm">Активен</p>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {features.map(f => (
              <div key={f.title} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <p className="font-bold text-[#1E1B4B] text-sm">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
                {isPremium && <span className="ml-auto text-green-500 font-black text-sm">✓</span>}
              </div>
            ))}
          </div>

          {!isPremium && !trialUsed && (
            <button
              onClick={handleActivate}
              disabled={activating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-lg active:scale-95 transition-transform disabled:opacity-50">
              {activating ? "Активация..." : "🎁 Попробовать 7 дней бесплатно"}
            </button>
          )}

          {!isPremium && trialUsed && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-amber-700 font-bold text-sm">Пробный период завершён</p>
                <p className="text-amber-600 text-xs mt-1">Оформите подписку для доступа к Premium-функциям</p>
              </div>
              <button disabled className="w-full py-3.5 rounded-2xl bg-gray-200 text-gray-500 font-black text-sm relative overflow-hidden">
                Оформить подписку
                <span className="absolute top-1 right-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">в разработке</span>
              </button>
            </div>
          )}

          {isPremium && !isPremiumPaid && trialActive && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                <p className="text-blue-700 font-bold text-sm">Пробный период истекает через {trialDaysLeft} {trialDaysLeft === 1 ? "день" : trialDaysLeft < 5 ? "дня" : "дней"}</p>
                <p className="text-blue-600 text-xs mt-1">Оформите подписку, чтобы не потерять доступ</p>
              </div>
              <button disabled className="w-full py-3.5 rounded-2xl bg-gray-200 text-gray-500 font-black text-sm relative overflow-hidden">
                Оформить подписку
                <span className="absolute top-1 right-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">в разработке</span>
              </button>
            </div>
          )}

          {isPremiumPaid && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
              <p className="text-green-700 font-bold text-sm">Premium активен</p>
              <p className="text-green-600 text-xs mt-1">Все функции доступны</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PremiumModal;
