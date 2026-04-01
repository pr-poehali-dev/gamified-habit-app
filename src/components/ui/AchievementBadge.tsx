import type { AchievementId } from "@/lib/gameTypes";

const ACHIEVEMENTS: Record<AchievementId, { emoji: string; title: string; desc: string }> = {
  first_task:  { emoji: "🎯", title: "Первый шаг",     desc: "Выполни первое задание" },
  tasks_5:     { emoji: "📋", title: "5 заданий",       desc: "Выполни 5 заданий" },
  tasks_10:    { emoji: "🏅", title: "10 заданий",      desc: "Выполни 10 заданий" },
  tasks_25:    { emoji: "🏆", title: "25 заданий",      desc: "Выполни 25 заданий" },
  stars_10:    { emoji: "⭐", title: "10 звёзд",        desc: "Набери 10 звёзд" },
  stars_50:    { emoji: "🌟", title: "50 звёзд",        desc: "Набери 50 звёзд" },
  stars_100:   { emoji: "💫", title: "100 звёзд",       desc: "Набери 100 звёзд" },
  level_3:     { emoji: "🥉", title: "Уровень 3",       desc: "Достигни 3 уровня" },
  level_5:     { emoji: "🥈", title: "Уровень 5",       desc: "Достигни 5 уровня" },
  level_10:    { emoji: "🥇", title: "Уровень 10",      desc: "Достигни 10 уровня" },
  spend_10:    { emoji: "🛍️", title: "Покупатель",      desc: "Потрать 10 звёзд" },
  spend_30:    { emoji: "💎", title: "Транжира",        desc: "Потрать 30 звёзд" },
  reward_1:    { emoji: "🎁", title: "Первая награда",  desc: "Купи первую награду" },
  reward_3:    { emoji: "🎀", title: "Коллекционер",   desc: "Купи 3 награды" },
  streak_3:    { emoji: "🔥", title: "3 дня подряд",   desc: "Стрик 3 дня" },
  streak_7:    { emoji: "💪", title: "Неделя!",         desc: "Стрик 7 дней" },
};

const ALL_IDS = Object.keys(ACHIEVEMENTS) as AchievementId[];

type Props = { unlockedIds: AchievementId[] };

export function AchievementGrid({ unlockedIds }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {ALL_IDS.map(id => {
        const a = ACHIEVEMENTS[id];
        const unlocked = unlockedIds.includes(id);
        return (
          <div key={id} className={`flex flex-col items-center gap-1 p-2 rounded-2xl text-center transition-all ${unlocked ? "bg-white shadow-sm" : "bg-gray-50 opacity-40"}`}>
            <span className="text-2xl">{a.emoji}</span>
            <p className="text-[9px] font-bold text-gray-600 leading-tight">{a.title}</p>
          </div>
        );
      })}
    </div>
  );
}
