import { getParentLevelInfo, getParentLevelTier } from "@/lib/gameTypes";

type Child = { id: number; name: string; stars: number; avatar: string; age: number; inviteCode: string | null; connected: boolean };

type ProfileProps = {
  name: string;
  parent_points: number;
  parent_xp: number;
  children: Child[];
  tasks_count: number;
  streak_current: number;
};

export function ParentTabProfile({ name, parent_points, parent_xp, children, tasks_count, streak_current }: ProfileProps) {
  const { level } = getParentLevelInfo(parent_xp);
  const tier = getParentLevelTier(level);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-6 text-center text-white shadow-lg">
        <div className="text-6xl mb-2">👨</div>
        <h2 className="text-2xl font-black">{name}</h2>
        <p className="opacity-80 font-bold">{tier.badge}</p>
        <div className="mt-3 bg-white/20 rounded-2xl px-4 py-2 inline-block">
          <p className="text-sm font-black">{parent_points.toLocaleString()} баллов</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Детей", value: children.length, emoji: "👨‍👧‍👦" },
          { label: "Задач создано", value: tasks_count, emoji: "📋" },
          { label: "Уровень", value: level, emoji: tier.emoji },
          { label: "Стрик", value: `${streak_current}🔥`, emoji: "📅" },
        ].map(s => (
          <div key={s.label} className="bg-white/90 rounded-3xl p-4 text-center shadow-sm">
            <div className="text-3xl mb-1">{s.emoji}</div>
            <div className="text-2xl font-black text-[#1E1B4B]">{s.value}</div>
            <div className="text-xs font-bold text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
