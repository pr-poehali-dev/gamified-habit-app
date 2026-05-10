import { getLevelInfo, getLevelTier, LEVEL_TIERS, STARS_PER_LEVEL } from "@/lib/gameTypes";

type StarsProps = { stars: number; totalStarsEarned: number; level: number; levelEmoji: string };

export function ChildTabStars({ stars, totalStarsEarned, level, levelEmoji }: StarsProps) {
  const earned = totalStarsEarned ?? stars;
  return (
    <>
      <h2 className="text-lg font-black text-[#2D1B69]">Мои звёзды</h2>
      <div className="bg-gradient-to-br from-[#FFD700] to-[#FF9500] rounded-3xl p-6 text-center shadow-lg">
        <div className="text-7xl mb-2">⭐</div>
        <div className="text-5xl font-black text-white">{stars}</div>
        <div className="text-white/80 font-bold mt-1">звёзд для обмена</div>
      </div>
      <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-3xl p-5 text-center shadow-lg">
        <div className="text-5xl mb-1">{levelEmoji}</div>
        <div className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">{getLevelTier(level).title} · Уровень {level}</div>
        <div className="mt-3">
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${getLevelInfo(earned).xpPct}%` }} />
          </div>
          <p className="text-white/70 text-xs mt-1.5">
            {getLevelInfo(earned).xpInLevel}/10 XP · до ур. {level + 1} ещё {STARS_PER_LEVEL - getLevelInfo(earned).xpInLevel}⭐
          </p>
        </div>
      </div>
      <div className="bg-white/90 rounded-3xl p-4 shadow-sm">
        <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Путь к чемпиону</p>
        <div className="flex items-center justify-between">
          {LEVEL_TIERS.map((tier, i) => {
            const reached = level >= tier.from;
            const isCurrent = getLevelTier(level).from === tier.from;
            return (
              <div key={tier.from} className="flex items-center">
                <div className={`flex flex-col items-center gap-1 ${reached ? "opacity-100" : "opacity-30"}`}>
                  <div className={`text-2xl transition-all ${isCurrent ? "scale-125 drop-shadow-md" : ""}`}>{tier.emoji}</div>
                  <span className={`text-[9px] font-bold ${isCurrent ? "text-[#FF6B9D]" : "text-gray-400"}`}>{tier.title}</span>
                </div>
                {i < LEVEL_TIERS.length - 1 && (
                  <div className={`w-5 h-px mx-1 mb-4 ${level >= LEVEL_TIERS[i + 1].from ? "bg-yellow-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
