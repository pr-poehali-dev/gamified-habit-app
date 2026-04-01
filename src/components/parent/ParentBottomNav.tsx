import { tg } from "@/components/miniapp/types";

export type ParentTab = "tasks" | "grades" | "children" | "bonuses" | "profile";

type Props = {
  tab: ParentTab;
  onTabChange: (tab: ParentTab) => void;
  pendingTasksCount: number;
  pendingGradesCount: number;
};

const NAV_ITEMS: { key: ParentTab; emoji: string; label: string }[] = [
  { key: "tasks",    emoji: "📋", label: "Задачи" },
  { key: "grades",   emoji: "📝", label: "Оценки" },
  { key: "children", emoji: "👨‍👧", label: "Дети" },
  { key: "bonuses",  emoji: "🏅", label: "Бонусы" },
  { key: "profile",  emoji: "👤", label: "Профиль" },
];

export function ParentBottomNav({ tab, onTabChange, pendingTasksCount, pendingGradesCount }: Props) {
  const getBadge = (key: ParentTab) => {
    if (key === "tasks") return pendingTasksCount;
    if (key === "grades") return pendingGradesCount;
    return 0;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-2 py-2 flex gap-0.5 border border-white">
        {NAV_ITEMS.map(t => {
          const badge = getBadge(t.key);
          return (
            <button key={t.key} onClick={() => { tg()?.HapticFeedback?.impactOccurred("light"); onTabChange(t.key); }}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-2xl transition-all duration-300 relative ${tab === t.key ? "bg-gradient-to-b from-[#6B7BFF] to-[#9B6BFF] scale-110 shadow-md" : "hover:bg-gray-50"}`}>
              {badge > 0 && tab !== t.key && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">{badge}</span>
              )}
              <span className="text-xl">{t.emoji}</span>
              <span className={`text-[9px] font-black ${tab === t.key ? "text-white" : "text-gray-400"}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
