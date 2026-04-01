import { getLevelInfo, getLevelTier, getLevelEmoji, LEVEL_TIERS, STARS_PER_LEVEL, getParentLevelInfo, getParentLevelTier } from "@/lib/gameTypes";

// ─── Child XpBar ──────────────────────────────────────────────────────────────

type XpBarProps = { stars: number; showTierHint?: boolean };

export function XpBar({ stars, showTierHint }: XpBarProps) {
  const { level, xpInLevel, xpPct } = getLevelInfo(stars);
  const tier = getLevelTier(level);
  const nextTier = LEVEL_TIERS.find(t => t.from > level);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{getLevelEmoji(level)}</span>
          <span className="text-sm font-black text-[#2D1B69]">Ур. {level} · {tier.title}</span>
        </div>
        <span className="text-xs font-bold text-gray-400">{xpInLevel}/{STARS_PER_LEVEL} XP</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
      </div>
      {showTierHint && nextTier && (
        <p className="text-xs text-gray-400 mt-1">До {nextTier.emoji} {nextTier.title}: {nextTier.from - level} ур.</p>
      )}
    </div>
  );
}

// ─── LevelUpModal ─────────────────────────────────────────────────────────────

type LevelUpProps = { level: number; onClose: () => void };

export function LevelUpModal({ level, onClose }: LevelUpProps) {
  const tier = getLevelTier(level);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl" style={{ animation: "bounceIn 0.5s ease" }}>
        <div className="text-6xl mb-3" style={{ animation: "spin 1s ease" }}>{tier.emoji}</div>
        <h2 className="text-2xl font-black text-[#2D1B69] mb-1">Уровень {level}!</h2>
        <p className="text-gray-500 font-semibold mb-1">{tier.title}</p>
        <p className="text-gray-400 text-sm mb-5">Так держать! 🎉</p>
        <button onClick={onClose} className="bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white font-black px-6 py-3 rounded-2xl active:scale-95 transition-transform">
          Ура!
        </button>
      </div>
      <style>{`
        @keyframes bounceIn { 0%{transform:scale(0.5);opacity:0} 70%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @keyframes spin { 0%{transform:rotate(-10deg) scale(0.5)} 100%{transform:rotate(0deg) scale(1)} }
      `}</style>
    </div>
  );
}

// ─── Parent XpBar ─────────────────────────────────────────────────────────────

type ParentXpBarProps = { xp: number; points: number };

export function ParentXpBar({ xp, points }: ParentXpBarProps) {
  const { level, xpInLevel, xpPct } = getParentLevelInfo(xp);
  const tier = getParentLevelTier(level);

  return (
    <div className="bg-white/80 rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{tier.emoji}</span>
          <span className="text-sm font-black text-[#1E1B4B]">Ур. {level} · {tier.badge.replace(/^.+? /, "")}</span>
        </div>
        <span className="text-xs font-bold text-amber-500">{points.toLocaleString()} баллов</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">{xpInLevel}/100 XP до следующего уровня</p>
    </div>
  );
}
