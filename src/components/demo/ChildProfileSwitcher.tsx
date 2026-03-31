import { getLevelInfo, getLevelEmoji, type ChildProfile } from "./types";

type Props = {
  profiles: ChildProfile[];
  activeId: number;
  onSwitch: (id: number) => void;
};

export function ChildProfileSwitcher({ profiles, activeId, onSwitch }: Props) {
  if (profiles.length <= 1) return null;

  return (
    <div className="flex justify-center px-4 mt-3">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-1 flex gap-1 shadow-sm border border-white">
        {profiles.map(p => {
          const { level } = getLevelInfo(p.stars);
          const emoji = getLevelEmoji(level);
          const active = p.id === activeId;
          return (
            <button
              key={p.id}
              onClick={() => onSwitch(p.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${
                active
                  ? "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] shadow-md scale-105"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className="text-lg">{p.avatar}</span>
              <div className="text-left">
                <p className={`text-xs font-black leading-tight ${active ? "text-white" : "text-[#2D1B69]"}`}>
                  {p.name}
                </p>
                <p className={`text-[9px] font-semibold leading-tight ${active ? "text-white/70" : "text-gray-400"}`}>
                  {emoji} ур. {level} · {p.stars}⭐
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
