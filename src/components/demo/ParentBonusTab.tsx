import { StreakCard } from "./StreakCard";
import {
  getParentLevelTier, getStreakBonus,
  PARTNER_PRIZES, PARENT_ACTION_LABELS, PARENT_ACTION_XP,
  type ParentAction, type StreakState,
} from "./types";

const PARENT_POINTS_PER_LEVEL_DISPLAY = "1 000";

type Props = {
  parentPoints: number;
  parentXp: number;
  streak: StreakState;
  purchasedPrizes: number[];
  onStreakClaim: () => void;
  onBuyPrize: (prizeId: number, cost: number) => void;
};

export function ParentBonusTab({
  parentPoints, parentXp, streak, purchasedPrizes, onStreakClaim, onBuyPrize,
}: Props) {
  const { level } = { level: Math.floor(parentXp / 100) + 1 };
  const tier = getParentLevelTier(level);

  return (
    <div className="animate-fade-in space-y-4">
      {/* Streak block */}
      <StreakCard streak={streak} onClaim={onStreakClaim} />

      {/* Balance card */}
      <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-5 text-white shadow-lg">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Ваш баланс</p>
        <p className="text-4xl font-black">{parentPoints.toLocaleString()} <span className="text-2xl font-bold">баллов</span></p>
        <p className="text-white/70 text-xs mt-2">+{PARENT_POINTS_PER_LEVEL_DISPLAY} баллов за каждый новый уровень</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg">{tier.emoji}</span>
          <span className="text-sm font-bold">{tier.badge}</span>
        </div>
      </div>

      {/* How to earn */}
      <div>
        <h3 className="text-base font-bold text-[#1E1B4B] mb-3">Как зарабатывать баллы</h3>
        <div className="space-y-2">
          {(Object.keys(PARENT_ACTION_LABELS) as ParentAction[]).map(action => (
            <div key={action} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
              <span className="text-xl">{PARENT_ACTION_LABELS[action].emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1E1B4B]">{PARENT_ACTION_LABELS[action].label}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[#6B7BFF]">+{PARENT_ACTION_XP[action]} XP</p>
              </div>
            </div>
          ))}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1E1B4B]">Новый уровень</p>
              <p className="text-xs text-gray-400">Автоматически при наборе XP</p>
            </div>
            <p className="text-xs font-bold text-amber-600">+1 000 баллов</p>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-xl">🔥</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1E1B4B]">Ежедневный стрик</p>
              <p className="text-xs text-gray-400">Действуй каждый день — бонус растёт</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-orange-600">до +{getStreakBonus(10).points} б.</p>
              <p className="text-xs text-orange-400">на день 10</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prize store */}
      <div>
        <h3 className="text-base font-bold text-[#1E1B4B] mb-3">Магазин призов</h3>
        <div className="space-y-3">
          {PARTNER_PRIZES.map((prize, i) => {
            const bought = purchasedPrizes.includes(prize.id);
            const canBuy = parentPoints >= prize.cost && !bought;
            return (
              <div
                key={prize.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${bought ? "border-green-200 opacity-70" : "border-gray-100 hover:shadow-md"}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{prize.emoji}</div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1E1B4B] text-sm">{prize.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">от {prize.partner}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        prize.type === "coupon" ? "bg-blue-100 text-blue-600" :
                        prize.type === "ticket" ? "bg-purple-100 text-purple-600" :
                        prize.type === "promo" ? "bg-green-100 text-green-600" :
                        prize.type === "gift" ? "bg-pink-100 text-pink-600" :
                        "bg-amber-100 text-amber-600"
                      }`}>
                        {prize.type === "coupon" ? "Скидка" :
                         prize.type === "ticket" ? "Билет" :
                         prize.type === "promo" ? "Промокод" :
                         prize.type === "gift" ? "Подарок" : "Сертификат"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-sm font-black text-amber-600">{prize.cost.toLocaleString()} б.</p>
                    {bought ? (
                      <span className="text-xs font-bold text-green-500">✓ Получено</span>
                    ) : (
                      <button
                        onClick={() => onBuyPrize(prize.id, prize.cost)}
                        disabled={!canBuy}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                          canBuy
                            ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm hover:shadow-md"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Обменять
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
