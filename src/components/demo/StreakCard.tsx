import { useEffect } from "react";
import {
  getStreakBonus, getStreakEmoji, getStreakTitle,
  STREAK_DAYS_PREVIEW, STREAK_MAX_DAY,
  type StreakState,
} from "./types";

type StreakCardProps = {
  streak: StreakState;
  onClaim: () => void;
  compact?: boolean;
};

export function StreakCard({ streak, onClaim, compact = false }: StreakCardProps) {
  const { current, claimedToday } = streak;
  const bonus = getStreakBonus(current);
  const emoji = getStreakEmoji(current);
  const title = getStreakTitle(current);
  const isMax = current >= STREAK_MAX_DAY;

  if (compact) {
    return (
      <button
        onClick={!claimedToday ? onClaim : undefined}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
          claimedToday
            ? "bg-green-100 text-green-600"
            : "bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-sm hover:shadow-md active:scale-95"
        }`}
      >
        <span className="text-base">{claimedToday ? "✅" : emoji}</span>
        <span className="text-xs font-black">{current} {current === 1 ? "день" : current < 5 ? "дня" : "дней"}</span>
        {!claimedToday && <span className="text-[10px] opacity-80">забрать</span>}
      </button>
    );
  }

  return (
    <div className={`rounded-3xl overflow-hidden shadow-md ${
      isMax
        ? "bg-gradient-to-br from-orange-400 via-red-500 to-pink-600"
        : "bg-gradient-to-br from-orange-300 to-red-500"
    }`}>
      {/* Top: flame + title */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-4xl" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.2))" }}>
              {emoji}
            </span>
            <div>
              <p className="text-white font-black text-lg leading-tight">{title}</p>
              <p className="text-white/80 text-xs font-semibold">
                {current} {current === 1 ? "день" : current < 5 ? "дня" : "дней"} подряд
                {streak.longestStreak > current && (
                  <span className="ml-1 opacity-70">· рекорд {streak.longestStreak}</span>
                )}
              </p>
            </div>
          </div>
          {claimedToday && (
            <div className="bg-white/20 rounded-xl px-3 py-1">
              <p className="text-white text-xs font-black">✓ Сегодня</p>
            </div>
          )}
        </div>
      </div>

      {/* Day dots */}
      <div className="px-5 pb-4">
        <div className="flex gap-1.5 items-center">
          {STREAK_DAYS_PREVIEW.map(day => {
            const done = day <= current;
            const isToday = day === current;
            return (
              <div
                key={day}
                className={`flex-1 flex flex-col items-center gap-1`}
              >
                <div
                  className={`w-full rounded-lg transition-all duration-300 ${
                    isToday
                      ? "bg-white shadow-lg h-8"
                      : done
                        ? "bg-white/50 h-6"
                        : "bg-white/15 h-5"
                  }`}
                  style={isToday ? { boxShadow: "0 0 12px rgba(255,255,255,0.6)" } : undefined}
                >
                  {isToday && (
                    <div className="flex items-center justify-center h-full text-sm">
                      {emoji}
                    </div>
                  )}
                  {done && !isToday && (
                    <div className="flex items-center justify-center h-full text-[10px]">✓</div>
                  )}
                </div>
                <span className={`text-[9px] font-bold ${done ? "text-white" : "text-white/30"}`}>
                  {day === STREAK_MAX_DAY ? "🔥" : day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bonus claim */}
      <div className="bg-black/15 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-xs font-semibold opacity-80 mb-0.5">Бонус за сегодня</p>
            <div className="flex items-center gap-3">
              <span className="text-white font-black text-sm">+{bonus.xp} XP</span>
              <span className="text-white/50 text-xs">·</span>
              <span className="text-white font-black text-sm">+{bonus.points} баллов</span>
            </div>
            {isMax && (
              <p className="text-yellow-200 text-xs font-bold mt-0.5">🏆 Максимальный бонус!</p>
            )}
          </div>
          {claimedToday ? (
            <div className="bg-white/20 rounded-2xl px-4 py-2">
              <p className="text-white text-sm font-black">Получено ✓</p>
            </div>
          ) : (
            <button
              onClick={onClaim}
              className="bg-white text-red-500 font-black text-sm px-4 py-2.5 rounded-2xl shadow-md active:scale-95 transition-all hover:shadow-lg"
            >
              Забрать
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function StreakBonusModal({
  day,
  xp,
  points,
  onClose,
}: {
  day: number;
  xp: number;
  points: number;
  onClose: () => void;
}) {
  const emoji = getStreakEmoji(day);
  const title = getStreakTitle(day);

  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 rounded-3xl p-8 text-center shadow-2xl w-full max-w-xs"
        style={{ animation: "levelUpPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-7xl mb-2" style={{ animation: "spinOnce 0.6s ease-out 0.2s both" }}>
          {emoji}
        </div>
        <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Серия {day} {day === 1 ? "день" : day < 5 ? "дня" : "дней"}</p>
        <p className="text-white text-2xl font-black mb-4">{title}</p>
        <div className="flex gap-3 justify-center mb-4">
          <div className="bg-white/20 rounded-2xl px-4 py-3 flex-1">
            <p className="text-white/70 text-xs mb-0.5">XP</p>
            <p className="text-white text-2xl font-black">+{xp}</p>
          </div>
          <div className="bg-white/20 rounded-2xl px-4 py-3 flex-1">
            <p className="text-white/70 text-xs mb-0.5">Баллы</p>
            <p className="text-white text-2xl font-black">+{points}</p>
          </div>
        </div>
        {day === STREAK_MAX_DAY && (
          <p className="text-yellow-200 text-sm font-bold mb-3">🏆 Максимальный бонус достигнут!</p>
        )}
        <button
          onClick={onClose}
          className="bg-white/30 text-white font-bold rounded-2xl px-6 py-2 text-sm active:scale-95 transition-transform"
        >
          Отлично! 🔥
        </button>
      </div>
    </div>
  );
}
