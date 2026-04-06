import { tg } from "@/components/miniapp/types";

export type ChildTab = "tasks" | "shop" | "grades" | "friends" | "profile";

type Props = {
  tab: ChildTab;
  onTabChange: (tab: ChildTab) => void;
  pendingTasksCount: number;
  doneTasksCount: number;
  pendingGradesCount: number;
  friendRequestsCount: number;
  level: number;
};

const NAV_ITEMS: { key: ChildTab; emoji: string; label: string }[] = [
  { key: "tasks",        emoji: "📋", label: "Задачи" },
  { key: "shop",         emoji: "🛍️", label: "Магазин" },
  { key: "grades",       emoji: "📝", label: "Оценки" },
  { key: "friends",      emoji: "👥", label: "Друзья" },
  { key: "profile",      emoji: "👤", label: "Профиль" },
];

export function ChildBottomNav({ tab, onTabChange, pendingTasksCount, doneTasksCount, pendingGradesCount, friendRequestsCount, level }: Props) {
  const getBadge = (key: ChildTab) => {
    if (key === "tasks") return pendingTasksCount + doneTasksCount;
    if (key === "grades") return pendingGradesCount;
    if (key === "friends") return friendRequestsCount;
    return 0;
  };
  const isLocked = (key: ChildTab) => key === "grades" && level < 2;

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-2 py-2 flex gap-0.5 border border-white">
        {NAV_ITEMS.map(t => {
          const badge = getBadge(t.key);
          const locked = isLocked(t.key);
          return (
            <button key={t.key}
              onClick={() => { tg()?.HapticFeedback?.impactOccurred("light"); onTabChange(t.key); }}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-2xl transition-all duration-300 relative ${tab === t.key ? "bg-gradient-to-b from-[#FF6B9D] to-[#FF9B6B] scale-110 shadow-md" : locked ? "opacity-50" : "hover:bg-gray-50"}`}>
              {locked && tab !== t.key && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full text-[9px] font-black text-white flex items-center justify-center">🔒</span>
              )}
              {badge > 0 && !locked && tab !== t.key && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">{badge}</span>
              )}
              <span className="text-lg">{t.emoji}</span>
              <span className={`text-[9px] font-black ${tab === t.key ? "text-white" : "text-gray-400"}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}