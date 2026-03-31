import { useState } from "react";
import { ACHIEVEMENTS, RARITY_CONFIG, type AchievementId } from "./types";

type Props = {
  unlockedIds: AchievementId[];
  compact?: boolean;
  maxVisible?: number;
};

export function AchievementBadge({ id, unlocked }: { id: AchievementId; unlocked: boolean }) {
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return null;
  const cfg = RARITY_CONFIG[ach.rarity];
  return (
    <div
      className={`relative flex flex-col items-center gap-1 rounded-2xl p-3 border-2 transition-all ${
        unlocked
          ? `bg-gradient-to-br ${cfg.bg} ${cfg.border} ${cfg.glow}`
          : "bg-gray-50 border-gray-100 opacity-40 grayscale"
      }`}
      title={ach.desc}
    >
      <span className="text-2xl">{ach.emoji}</span>
      <span className="text-[10px] font-black text-center leading-tight" style={{ color: unlocked ? cfg.color : "#9CA3AF" }}>
        {ach.title}
      </span>
      <span className={`text-[8px] font-bold uppercase tracking-wide ${unlocked ? "" : "text-gray-300"}`} style={{ color: unlocked ? cfg.color : undefined }}>
        {cfg.label}
      </span>
      {!unlocked && (
        <span className="absolute top-1 right-1 text-[10px]">🔒</span>
      )}
    </div>
  );
}

export function AchievementRow({ unlockedIds, compact = false, maxVisible = 5 }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    const unlocked = ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id));
    const show = expanded ? unlocked : unlocked.slice(0, maxVisible);
    const more = unlocked.length - maxVisible;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {show.map(a => {
          const cfg = RARITY_CONFIG[a.rarity];
          return (
            <div
              key={a.id}
              className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center text-base bg-gradient-to-br ${cfg.bg} ${cfg.border} ${cfg.glow}`}
              title={`${a.title} — ${a.desc}`}
            >
              {a.emoji}
            </div>
          );
        })}
        {!expanded && more > 0 && (
          <button
            onClick={() => setExpanded(true)}
            className="w-8 h-8 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-500"
          >
            +{more}
          </button>
        )}
      </div>
    );
  }

  return null;
}

export function AchievementGrid({ unlockedIds }: { unlockedIds: AchievementId[] }) {
  const rarityOrder: (keyof typeof RARITY_CONFIG)[] = ["legendary", "mythical", "rare", "uncommon", "common"];

  return (
    <div className="space-y-4">
      {rarityOrder.map(rarity => {
        const group = ACHIEVEMENTS.filter(a => a.rarity === rarity);
        const cfg = RARITY_CONFIG[rarity];
        const unlockedCount = group.filter(a => unlockedIds.includes(a.id)).length;
        return (
          <div key={rarity}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              <span className="text-xs text-gray-400 font-semibold">
                {unlockedCount}/{group.length}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {group.map(ach => (
                <AchievementBadge
                  key={ach.id}
                  id={ach.id}
                  unlocked={unlockedIds.includes(ach.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NewAchievementModal({
  ids,
  onClose,
}: {
  ids: AchievementId[];
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const ach = ACHIEVEMENTS.find(a => a.id === ids[idx]);
  if (!ach) return null;
  const cfg = RARITY_CONFIG[ach.rarity];

  const next = () => {
    if (idx < ids.length - 1) setIdx(i => i + 1);
    else onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={next}
    >
      <div
        className={`bg-gradient-to-br ${cfg.bg} border-2 ${cfg.border} rounded-3xl p-8 text-center shadow-2xl w-full max-w-xs ${cfg.glow}`}
        style={{ animation: "levelUpPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={e => e.stopPropagation()}
      >
        {ids.length > 1 && (
          <p className="text-xs font-bold text-gray-400 mb-2">{idx + 1} из {ids.length}</p>
        )}
        <div className="text-7xl mb-3" style={{ animation: "spinOnce 0.6s ease-out 0.2s both" }}>
          {ach.emoji}
        </div>
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: cfg.color }}>
          Новая ачивка · {cfg.label}
        </p>
        <p className="text-[#1E1B4B] text-2xl font-black mb-2">{ach.title}</p>
        <p className="text-gray-500 text-sm font-semibold mb-5">{ach.desc}</p>
        <button
          onClick={next}
          className="font-bold rounded-2xl px-6 py-2 text-sm active:scale-95 transition-transform text-white"
          style={{ background: cfg.color }}
        >
          {idx < ids.length - 1 ? "Следующая →" : "Ура! 🎉"}
        </button>
      </div>
    </div>
  );
}
