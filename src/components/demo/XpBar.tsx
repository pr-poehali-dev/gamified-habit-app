import { useEffect } from "react";
import { getLevelInfo, getLevelTier, getLevelEmoji, getNextTier, LEVEL_TIERS, STARS_PER_LEVEL } from "./types";

export function XpBar({ stars, showTierHint = false }: { stars: number; showTierHint?: boolean }) {
  const { level, xpInLevel, xpPct } = getLevelInfo(stars);
  const tier = getLevelTier(level);
  const nextTier = getNextTier(level);
  const left = STARS_PER_LEVEL - xpInLevel;
  const levelsToNext = nextTier ? nextTier.from - level : null;

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{tier.emoji}</span>
          <div>
            <span className="font-black text-[#2D1B69] text-sm">Уровень {level}</span>
            <span className="text-gray-400 text-xs font-semibold ml-1.5">{tier.title}</span>
          </div>
        </div>
        <span className="text-gray-400 text-xs font-semibold">
          {left === 0 ? "🎉 Новый уровень!" : `⚡ ещё ${left} ${left === 1 ? "звезда" : left < 5 ? "звезды" : "звёзд"}`}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full transition-all duration-700"
          style={{ width: `${xpPct}%` }}
        />
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(p => (
          <div key={p} className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${p}%` }} />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-gray-300">0%</span>
        <span className="text-[9px] text-gray-400 font-semibold">{xpInLevel}/10 XP</span>
        <span className="text-[9px] text-gray-300">100%</span>
      </div>
      {showTierHint && nextTier && levelsToNext !== null && (
        <div className="mt-2.5 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <span className="text-base">{tier.emoji}</span>
          <span className="text-gray-300 text-xs">→</span>
          <span className="text-base">{nextTier.emoji}</span>
          <span className="text-xs text-gray-500 font-semibold flex-1">
            До <b>{nextTier.title}</b>: ещё {levelsToNext} {levelsToNext === 1 ? "уровень" : levelsToNext < 5 ? "уровня" : "уровней"} (ур. {nextTier.from})
          </span>
        </div>
      )}
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
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
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
            <span key={i} className="text-2xl" style={{ animation: `starPop 0.4s ease-out ${0.4 + i * 0.08}s both` }}>
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
