import { useState } from "react";
import { getParentLevelInfo, getParentLevelTier, PARTNER_PRIZES } from "@/lib/gameTypes";

type PartnersProps = {
  parent_points: number;
  parent_xp: number;
};

export function ParentTabPartners({ parent_points, parent_xp }: PartnersProps) {
  const { level } = getParentLevelInfo(parent_xp);
  const tier = getParentLevelTier(level);
  const [exchanged, setExchanged] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Шапка */}
      <div className="bg-gradient-to-br from-[#FF6B35] via-[#FF3D9A] to-[#9B6BFF] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
        <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1 relative">Магазин призов</p>
        <h2 className="text-2xl font-black relative">🎁 Партнёры</h2>
        <p className="text-white/80 text-xs mt-1 relative">Обменивайте баллы на реальные призы от наших партнёров</p>
        <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center justify-between relative">
          <div>
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">Ваш баланс</p>
            <p className="text-2xl font-black">{parent_points.toLocaleString()} <span className="text-base font-bold">баллов</span></p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">Статус</p>
            <p className="text-sm font-black">{tier.emoji} {tier.badge}</p>
          </div>
        </div>
      </div>

      {/* Список призов */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-base font-bold text-[#1E1B4B]">Доступные призы</h3>
          <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF3D9A] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{PARTNER_PRIZES.length} предложений</span>
        </div>
        {PARTNER_PRIZES.map(prize => {
          const canBuy = parent_points >= prize.cost;
          const isExchanged = exchanged === prize.id;
          const progress = Math.min((parent_points / prize.cost) * 100, 100);
          return (
            <div key={prize.id} className={`bg-white rounded-2xl shadow-sm border mb-3 overflow-hidden transition-all ${canBuy ? "border-[#FF6B35]/30 shadow-[#FF6B35]/10 shadow-md" : "border-gray-100"}`}>
              {canBuy && (
                <div className="h-1 bg-gradient-to-r from-[#FF6B35] to-[#FF3D9A]" />
              )}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${canBuy ? "bg-gradient-to-br from-[#FF6B35]/10 to-[#FF3D9A]/10" : "bg-gray-50"}`}>
                    {prize.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#1E1B4B] text-sm">{prize.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">от <span className="font-semibold text-gray-500">{prize.partner}</span></p>
                    {!canBuy && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>{parent_points.toLocaleString()} из {prize.cost.toLocaleString()} б.</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF3D9A] rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🏅</span>
                    <p className="text-sm font-black text-[#FF6B35]">{prize.cost.toLocaleString()} баллов</p>
                  </div>
                  {isExchanged ? (
                    <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-xl">
                      <span className="text-sm">✅</span>
                      <span className="text-xs font-black text-green-600">Заявка отправлена!</span>
                    </div>
                  ) : (
                    <button
                      disabled={!canBuy}
                      onClick={() => canBuy && setExchanged(prize.id)}
                      className={`text-sm font-black px-4 py-2 rounded-xl transition-all active:scale-95
                        ${canBuy
                          ? "bg-gradient-to-r from-[#FF6B35] to-[#FF3D9A] text-white shadow-md shadow-[#FF6B35]/30"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}>
                      {canBuy ? "Обменять 🎉" : "Не хватает"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Инфо-блок */}
      <div className="bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 border border-[#6B7BFF]/20 rounded-2xl px-4 py-3 flex gap-3 items-start">
        <span className="text-xl">💡</span>
        <div>
          <p className="text-xs font-bold text-[#6B7BFF] uppercase tracking-wide mb-0.5">Как получить больше баллов?</p>
          <p className="text-sm text-gray-600">Создавайте задачи, подтверждайте оценки и поддерживайте ежедневный стрик — за каждое действие начисляются баллы!</p>
        </div>
      </div>
    </div>
  );
}
