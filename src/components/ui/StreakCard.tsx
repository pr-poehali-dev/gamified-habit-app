import type { StreakState } from "@/lib/gameTypes";

type Props = { streak: StreakState; onClaim: () => void; compact?: boolean };

export function StreakCard({ streak, onClaim, compact }: Props) {
  const canClaim = !streak.claimedToday && streak.current > 0;

  if (compact) {
    return (
      <button onClick={canClaim ? onClaim : undefined}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-black transition-all ${canClaim ? "bg-gradient-to-r from-orange-400 to-amber-500 text-white active:scale-95 shadow-md" : "bg-orange-50 text-orange-400"}`}>
        🔥 {streak.current}
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl p-5 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Стрик активности</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-4xl font-black">{streak.current}</span>
            <span className="text-2xl">🔥</span>
          </div>
          <p className="text-white/70 text-xs mt-1">Рекорд: {streak.longestStreak} дней</p>
        </div>
        <div className="text-right">
          {canClaim ? (
            <button onClick={onClaim}
              className="bg-white text-orange-500 font-black text-sm px-4 py-2 rounded-2xl active:scale-95 transition-transform shadow-md">
              Получить!
            </button>
          ) : (
            <div className="bg-white/20 rounded-2xl px-3 py-2 text-center">
              <p className="text-xs font-bold">✅ Получено</p>
              <p className="text-xs text-white/70">сегодня</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
