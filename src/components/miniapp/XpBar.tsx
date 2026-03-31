import { useEffect } from "react";
import { tg, getLevelEmoji, getLevelTier, getNextTier, getLevelInfo, LEVEL_TIERS, STARS_PER_LEVEL } from "./types";
import type { Task } from "./types";

export function XpBar({ stars }: { stars: number }) {
  const { level, xpInLevel, xpPct } = getLevelInfo(stars);
  const tier = getLevelTier(level);
  const nextTier = getNextTier(level);
  const left = STARS_PER_LEVEL - xpInLevel;
  const levelsToNext = nextTier ? nextTier.from - level : null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{tier.emoji}</span>
          <div>
            <span className="text-white font-bold text-sm">Уровень {level}</span>
            <span className="text-white/50 text-xs ml-1.5">{tier.title}</span>
          </div>
        </div>
        <span className="text-white/70 text-xs">
          {left === 0 ? "🎉 Новый уровень!" : `⚡ ещё ${left} ${left === 1 ? "звезда" : left < 5 ? "звезды" : "звёзд"}`}
        </span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 rounded-full transition-all duration-700"
          style={{ width: `${xpPct}%` }}
        />
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(p => (
          <div key={p} className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: `${p}%` }} />
        ))}
      </div>
      {nextTier && levelsToNext !== null && (
        <div className="mt-2 flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5">
          <span className="text-sm">{tier.emoji}</span>
          <span className="text-white/30 text-xs">→</span>
          <span className="text-sm">{nextTier.emoji}</span>
          <span className="text-white/60 text-xs flex-1">
            До <span className="text-white font-semibold">{nextTier.title}</span>: ещё {levelsToNext} {levelsToNext === 1 ? "уровень" : levelsToNext < 5 ? "уровня" : "уровней"} (ур. {nextTier.from})
          </span>
        </div>
      )}

      {/* Tier roadmap */}
      <div className="mt-2.5 flex items-center justify-between px-1">
        {LEVEL_TIERS.map((t, i) => {
          const reached = level >= t.from;
          const isCurrent = getLevelTier(level).from === t.from;
          return (
            <div key={t.from} className="flex items-center">
              <div className={`flex flex-col items-center gap-0.5 transition-all ${reached ? "opacity-100" : "opacity-25"}`}>
                <span className={`text-base ${isCurrent ? "scale-125 drop-shadow" : ""}`}>{t.emoji}</span>
                <span className={`text-[8px] font-bold ${isCurrent ? "text-yellow-300" : "text-white/50"}`}>{t.title}</span>
              </div>
              {i < LEVEL_TIERS.length - 1 && (
                <div className={`w-4 h-px mx-0.5 mb-3 ${level >= LEVEL_TIERS[i + 1].from ? "bg-yellow-400" : "bg-white/20"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  const emoji = getLevelEmoji(level);
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-8 text-center shadow-2xl w-full max-w-xs"
        style={{ animation: "levelUpPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div className="text-7xl mb-3" style={{ animation: "spinOnce 0.6s ease-out 0.2s both" }}>
          {emoji}
        </div>
        <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-1">Новый уровень!</p>
        <p className="text-white text-5xl font-black mb-2">{level}</p>
        <p className="text-white/90 text-base font-semibold">Так держать! Ты становишься лучше!</p>
        <div className="mt-5 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="text-2xl"
              style={{ animation: `starPop 0.4s ease-out ${0.4 + i * 0.08}s both` }}
            >
              ⭐
            </span>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-5 bg-white/30 text-white font-bold rounded-2xl px-6 py-2 text-sm active:scale-95 transition-transform"
        >
          Ура! 🎉
        </button>
      </div>
    </div>
  );
}

export function TaskCard({ task, onComplete, onApprove, isParent }: {
  task: Task;
  onComplete?: (id: number) => void;
  onApprove?: (id: number) => void;
  isParent?: boolean;
}) {
  const formatDeadlineLocal = (iso: string | null) => {
    if (!iso) return null;
    const now = Date.now();
    const dl = new Date(iso).getTime();
    const diff = dl - now;
    if (diff < 0) {
      const h = Math.floor(Math.abs(diff) / 3600000);
      return { label: `просрочено ${h > 0 ? h + "ч" : ""} назад`, color: "text-red-500" };
    }
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (h <= 2) return { label: `${h}ч осталось!`, color: "text-orange-500" };
    if (d >= 1) return { label: `${d}д ${h % 24}ч`, color: "text-yellow-600" };
    return { label: `${h}ч`, color: "text-yellow-600" };
  };

  const dl = formatDeadlineLocal(task.deadline);
  const isPending = task.status === "pending";
  const isDone = task.status === "done";
  const isApproved = task.status === "approved";

  return (
    <div className={`rounded-2xl p-4 mb-3 shadow-sm border transition-all duration-200 ${
      isApproved ? "bg-green-50 border-green-100" :
      isDone ? "bg-blue-50 border-blue-100" :
      task.is_overdue ? "bg-red-50 border-red-200" :
      "bg-white border-gray-100"
    }`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{task.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-gray-800 leading-snug ${isApproved ? "line-through text-gray-400" : ""}`}>
              {task.title}
            </p>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-yellow-500 font-bold text-sm whitespace-nowrap">
                {task.is_overdue && task.late_stars !== null && task.late_stars !== undefined && task.late_stars < task.original_stars ? (
                  <><s className="text-gray-400">{task.original_stars}</s> → {task.stars}⭐</>
                ) : `${task.stars}⭐`}
              </span>
            </div>
          </div>

          {isParent && task.child_name && (
            <p className="text-xs text-gray-500 mt-0.5">👤 {task.child_name}</p>
          )}

          {dl && isPending && (
            <p className={`text-xs mt-1 font-medium ${dl.color}`}>
              ⏳ {dl.label}
            </p>
          )}

          {isApproved && (
            <p className="text-xs text-green-600 mt-1 font-medium">✅ Выполнено и подтверждено</p>
          )}
          {isDone && (
            <p className="text-xs text-blue-600 mt-1 font-medium">🕐 Ждёт подтверждения родителя</p>
          )}
          {isPending && task.is_overdue && !task.can_complete && (
            <p className="text-xs text-red-500 mt-1 font-medium">🚫 Срок вышел, нельзя выполнить</p>
          )}
        </div>
      </div>

      {isPending && task.can_complete && onComplete && (
        <button
          onClick={() => { tg()?.HapticFeedback?.impactOccurred("light"); onComplete(task.id); }}
          className="mt-3 w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl py-2.5 text-sm active:scale-95 transition-transform"
        >
          ✅ Выполнил!
        </button>
      )}

      {isDone && isParent && onApprove && (
        <button
          onClick={() => { tg()?.HapticFeedback?.impactOccurred("medium"); onApprove(task.id); }}
          className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl py-2.5 text-sm active:scale-95 transition-transform"
        >
          ✅ Подтвердить
        </button>
      )}
    </div>
  );
}
