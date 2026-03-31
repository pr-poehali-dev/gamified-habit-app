import { useState } from "react";
import { ALL_STICKERS, RARITY_CONFIG, rollSticker, type Sticker, type StickerRarity } from "./types";

type CollectedSticker = { stickerId: string; count: number };

type Props = {
  collected: CollectedSticker[];
  onOpenPack: () => Sticker;
  canOpenPack: boolean;
  packsAvailable: number;
};

const RARITY_ORDER: StickerRarity[] = ["legendary", "mythical", "rare", "uncommon", "common"];

export function StickerCard({ sticker, count = 0 }: { sticker: Sticker; count?: number }) {
  const cfg = RARITY_CONFIG[sticker.rarity];
  const owned = count > 0;

  return (
    <div
      className={`relative rounded-2xl border-2 p-3 flex flex-col items-center gap-1.5 transition-all ${
        owned
          ? `bg-gradient-to-br ${cfg.bg} ${cfg.border} ${cfg.glow}`
          : "bg-gray-50 border-gray-100 grayscale opacity-40"
      }`}
    >
      {/* Rarity glow for legendary/mythical */}
      {owned && (sticker.rarity === "legendary" || sticker.rarity === "mythical") && (
        <div
          className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 30%, ${cfg.color}, transparent 70%)` }}
        />
      )}

      <span className={`text-3xl ${owned && sticker.animationClass ? sticker.animationClass : ""}`}>
        {sticker.emoji}
      </span>

      <span className="text-[10px] font-black text-center leading-tight text-gray-700">
        {sticker.name}
      </span>

      <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color: owned ? cfg.color : "#9CA3AF" }}>
        {cfg.label}
      </span>

      {owned && sticker.avatarOverride && (
        <span className="text-[8px] bg-purple-100 text-purple-600 font-bold px-1.5 py-0.5 rounded-full">
          аватар
        </span>
      )}

      {count > 1 && (
        <span className="absolute top-1 right-1 bg-gray-700 text-white text-[9px] font-black px-1.5 rounded-full">
          ×{count}
        </span>
      )}

      {!owned && <span className="absolute top-1 right-1 text-xs">❓</span>}
    </div>
  );
}

export function StickerCollection({ collected, onOpenPack, canOpenPack, packsAvailable }: Props) {
  const [filter, setFilter] = useState<StickerRarity | "all">("all");
  const [newSticker, setNewSticker] = useState<Sticker | null>(null);
  const [opening, setOpening] = useState(false);

  const getCount = (id: string) => collected.find(c => c.stickerId === id)?.count ?? 0;
  const totalOwned = ALL_STICKERS.filter(s => getCount(s.id) > 0).length;

  const filtered = filter === "all"
    ? ALL_STICKERS
    : ALL_STICKERS.filter(s => s.rarity === filter);

  const handleOpen = () => {
    if (!canOpenPack || opening) return;
    setOpening(true);
    setTimeout(() => {
      const sticker = onOpenPack();
      setNewSticker(sticker);
      setOpening(false);
    }, 600);
  };

  return (
    <div className="animate-fade-in space-y-4">
      {/* Pack open button */}
      <div className={`rounded-3xl overflow-hidden shadow-md ${canOpenPack ? "bg-gradient-to-br from-violet-500 to-purple-700" : "bg-gray-200"}`}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <div>
            <p className={`font-black text-lg ${canOpenPack ? "text-white" : "text-gray-400"}`}>
              Пак стикеров
            </p>
            <p className={`text-sm ${canOpenPack ? "text-white/70" : "text-gray-400"}`}>
              Открыто {totalOwned}/{ALL_STICKERS.length} стикеров
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs font-bold mb-1 ${canOpenPack ? "text-white/70" : "text-gray-400"}`}>
              Доступно паков
            </p>
            <p className={`text-3xl font-black ${canOpenPack ? "text-white" : "text-gray-400"}`}>
              {packsAvailable}
            </p>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={handleOpen}
            disabled={!canOpenPack || opening}
            className={`w-full py-3 rounded-2xl font-black text-sm transition-all active:scale-95 ${
              canOpenPack
                ? "bg-white text-violet-600 shadow-md hover:shadow-lg"
                : "bg-gray-300 text-gray-400 cursor-not-allowed"
            }`}
          >
            {opening ? "✨ Открываем..." : canOpenPack ? "🎴 Открыть пак" : "Нет доступных паков"}
          </button>
          {!canOpenPack && (
            <p className="text-xs text-gray-400 text-center mt-2">
              Паки выдаются за выполнение заданий и уровни
            </p>
          )}
        </div>
      </div>

      {/* Rarity filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilter("all")}
          className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${filter === "all" ? "bg-[#6B7BFF] text-white" : "bg-white text-gray-500 shadow-sm"}`}
        >
          Все {totalOwned}/{ALL_STICKERS.length}
        </button>
        {RARITY_ORDER.map(r => {
          const cfg = RARITY_CONFIG[r];
          const count = ALL_STICKERS.filter(s => s.rarity === r && getCount(s.id) > 0).length;
          const total = ALL_STICKERS.filter(s => s.rarity === r).length;
          return (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-all border ${
                filter === r ? "text-white" : "bg-white text-gray-500 shadow-sm border-transparent"
              }`}
              style={filter === r ? { background: cfg.color, borderColor: cfg.color } : undefined}
            >
              {cfg.label} {count}/{total}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-2">
        {filtered.map(sticker => (
          <StickerCard key={sticker.id} sticker={sticker} count={getCount(sticker.id)} />
        ))}
      </div>

      {/* New sticker modal */}
      {newSticker && (
        <StickerRevealModal sticker={newSticker} onClose={() => setNewSticker(null)} />
      )}
    </div>
  );
}

function StickerRevealModal({ sticker, onClose }: { sticker: Sticker; onClose: () => void }) {
  const cfg = RARITY_CONFIG[sticker.rarity];
  const isSpecial = sticker.rarity === "legendary" || sticker.rarity === "mythical";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className={`bg-gradient-to-br ${cfg.bg} border-2 ${cfg.border} rounded-3xl p-8 text-center shadow-2xl w-full max-w-xs ${cfg.glow}`}
        style={{ animation: "levelUpPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={e => e.stopPropagation()}
      >
        {isSpecial && (
          <div className="flex justify-center gap-1 mb-3">
            {["✨", "⭐", "✨"].map((e, i) => (
              <span key={i} className="text-xl" style={{ animation: `starPop 0.4s ease-out ${i * 0.1}s both` }}>{e}</span>
            ))}
          </div>
        )}
        <div
          className={`text-8xl mb-3 ${sticker.animationClass ?? ""}`}
          style={{ animation: "spinOnce 0.6s ease-out 0.2s both", filter: `drop-shadow(0 0 16px ${cfg.color}50)` }}
        >
          {sticker.emoji}
        </div>
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: cfg.color }}>
          {cfg.label} стикер
        </p>
        <p className="text-[#1E1B4B] text-2xl font-black mb-1">{sticker.name}</p>
        <p className="text-gray-500 text-sm font-semibold mb-4">{sticker.description}</p>
        {sticker.avatarOverride && (
          <div className="bg-purple-100 rounded-2xl px-3 py-2 mb-4">
            <p className="text-purple-700 text-xs font-black">🎭 Меняет твой аватар на {sticker.avatarOverride}!</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="font-bold rounded-2xl px-6 py-2.5 text-sm active:scale-95 transition-transform text-white"
          style={{ background: cfg.color }}
        >
          Круто! 🎉
        </button>
      </div>
    </div>
  );
}

export { rollSticker };
