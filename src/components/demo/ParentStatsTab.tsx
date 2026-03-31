import Icon from "@/components/ui/icon";
import {
  getLevelInfo, getLevelEmoji, getParentLevelInfo, getParentLevelTier,
  CHILDREN, PARENT_TASKS_LIST,
} from "./types";

// ─── Stats tab ────────────────────────────────────────────────────────────────

export function ParentStatsTab() {
  return (
    <div className="animate-fade-in space-y-4">
      <h2 className="text-lg font-bold text-[#1E1B4B]">Статистика</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Задач выполнено", value: "13", sub: "за всё время", color: "from-blue-500 to-indigo-600" },
          { label: "Звёзд выдано", value: "78", sub: "суммарно", color: "from-amber-400 to-orange-500" },
          { label: "Наград получено", value: "4", sub: "выкуплено", color: "from-green-400 to-teal-500" },
          { label: "Активных задач", value: "3", sub: "в работе", color: "from-violet-500 to-purple-600" },
        ].map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 shadow-sm`}>
            <p className="text-white/80 text-xs">{card.label}</p>
            <p className="text-white text-3xl font-black mt-1">{card.value}</p>
            <p className="text-white/60 text-xs mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <h3 className="text-base font-bold text-[#1E1B4B] mt-2">Прогресс детей</h3>
      {CHILDREN.map(child => {
        const { level: cLevel, xpPct, xpInLevel } = getLevelInfo(child.stars);
        const cEmoji = getLevelEmoji(cLevel);
        const pct = child.tasksTotal > 0 ? Math.round(child.tasksDone / child.tasksTotal * 100) : 0;
        return (
          <div key={child.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{child.avatar}</span>
                <div>
                  <p className="font-bold text-[#1E1B4B]">{child.name}</p>
                  <p className="text-xs text-gray-400">{child.tasksDone} из {child.tasksTotal} задач</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-yellow-500 font-black text-lg">{child.stars}⭐</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-sm">{cEmoji}</span>
                  <span className="text-xs text-gray-500 font-semibold">ур. {cLevel}</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div>
                <p className="text-xs text-gray-400 mb-1">Задачи: {pct}%</p>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">XP до ур. {cLevel + 1}: {xpInLevel}/10</p>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

type ProfileTabProps = {
  parentXp: number;
  parentPoints: number;
};

export function ParentProfileTab({ parentXp, parentPoints }: ProfileTabProps) {
  const { level } = getParentLevelInfo(parentXp);
  const tier = getParentLevelTier(level);

  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-6 text-center text-white shadow-lg mb-4">
        <div className="text-6xl mb-2">👨</div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-2xl">{tier.emoji}</span>
          <h2 className="text-2xl font-black">Андрей Иванов</h2>
        </div>
        <p className="opacity-80 font-bold">{tier.badge}</p>
        <div className="mt-3 bg-white/20 rounded-2xl px-4 py-2 inline-block">
          <p className="text-sm font-black">{parentPoints.toLocaleString()} баллов</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Детей", value: CHILDREN.length, emoji: "👨‍👧‍👦" },
          { label: "Задач создано", value: PARENT_TASKS_LIST.length, emoji: "📋" },
          { label: "Уровень", value: level, emoji: tier.emoji },
          { label: "Дней в системе", value: 14, emoji: "📅" },
        ].map(stat => (
          <div key={stat.label} className="bg-white/90 rounded-3xl p-4 text-center shadow-sm">
            <div className="text-3xl mb-1">{stat.emoji}</div>
            <div className="text-2xl font-black text-[#1E1B4B]">{stat.value}</div>
            <div className="text-xs font-bold text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-base font-bold text-[#1E1B4B] mt-4 mb-3">Уровни и привилегии</h3>
      <div className="space-y-2">
        {[
          { lvl: 1,  emoji: "🌱", title: "Новичок",   perk: "Персональные советы" },
          { lvl: 3,  emoji: "🥉", title: "Бронза",    perk: "Расширенная статистика" },
          { lvl: 5,  emoji: "🥈", title: "Серебро",   perk: "Доступ к призам партнёров" },
          { lvl: 8,  emoji: "🥇", title: "Золото",    perk: "Эксклюзивные купоны" },
          { lvl: 12, emoji: "💎", title: "Алмаз",     perk: "VIP-предложения" },
          { lvl: 18, emoji: "👑", title: "Легенда",   perk: "Особый статус и привилегии" },
        ].map(row => {
          const reached = level >= row.lvl;
          return (
            <div key={row.lvl} className={`flex items-center gap-3 rounded-2xl p-3 border transition-all ${reached ? "bg-white border-[#6B7BFF]/30 shadow-sm" : "bg-gray-50 border-gray-100 opacity-60"}`}>
              <span className="text-xl">{row.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1E1B4B]">Ур. {row.lvl} — {row.title}</p>
                <p className="text-xs text-gray-400">{row.perk}</p>
              </div>
              {reached && <Icon name="CheckCircle" size={16} className="text-[#6B7BFF]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
