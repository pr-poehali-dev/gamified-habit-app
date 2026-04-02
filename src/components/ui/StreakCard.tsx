import type { StreakState } from "@/lib/gameTypes";

type StreakReward = {
  todayXp: number;
  todayPoints: number;
  nextXp: number;
  nextPoints: number;
  claimed: boolean;
};

type Props = {
  streak: StreakState;
  reward?: StreakReward;
  compact?: boolean;
};

export function StreakCard({ streak, reward, compact }: Props) {
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-black transition-all ${
        reward?.claimed
          ? "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md"
          : "bg-orange-50 text-orange-400"
      }`}>
        🔥 {streak.current}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Ежедневный бонус</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-4xl font-black">{streak.current}</span>
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-white/70 text-xs mt-1">
            {streak.current === 1 ? "день подряд" :
             streak.current >= 2 && streak.current <= 4 ? "дня подряд" : "дней подряд"}
            {streak.longestStreak > streak.current ? ` • рекорд ${streak.longestStreak}` : ""}
          </p>
        </div>
        <div className="text-right">
          {reward?.claimed ? (
            <div className="bg-white/20 rounded-2xl px-3 py-2.5 text-center" style={{ animation: "fadeIn 0.3s ease" }}>
              <p className="text-xs font-black">+{reward.todayXp} XP</p>
              <p className="text-xs font-bold text-white/80">+{reward.todayPoints} баллов</p>
              <p className="text-[10px] text-white/60 mt-0.5">начислено</p>
            </div>
          ) : (
            <div className="bg-white/20 rounded-2xl px-3 py-2.5 text-center">
              <p className="text-xs font-bold text-white/80">Ожидание</p>
              <p className="text-[10px] text-white/60">активности</p>
            </div>
          )}
        </div>
      </div>

      {reward && (
        <div className="bg-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/60 font-semibold uppercase tracking-wide">Завтра</p>
            <p className="text-xs font-black">+{reward.nextXp} XP и +{reward.nextPoints} баллов</p>
          </div>
          <span className="text-lg">🎁</span>
        </div>
      )}
    </div>
  );
}

export default StreakCard;
