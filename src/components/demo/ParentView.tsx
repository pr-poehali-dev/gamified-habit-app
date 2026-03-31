import Icon from "@/components/ui/icon";
import {
  getLevelInfo, getLevelEmoji,
  SHOP_ITEMS, PARENT_TASKS_LIST, CHILDREN,
  type ParentTab,
} from "./types";

type Props = {
  parentTab: ParentTab;
  setParentTab: (tab: ParentTab) => void;
};

export default function ParentView({ parentTab, setParentTab }: Props) {
  return (
    <div className="max-w-md mx-auto px-4 pb-28 animate-fade-in">
      <div className="mt-6 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Добро пожаловать</p>
            <h1 className="text-2xl font-bold text-[#1E1B4B]">Андрей Иванов</h1>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-2xl flex items-center justify-center text-2xl shadow-md">
            👨
          </div>
        </div>
      </div>

      {parentTab === "tasks" && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1E1B4B]">Задачи</h2>
            <button className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
              + Добавить
            </button>
          </div>
          {PARENT_TASKS_LIST.map((item, i) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="text-2xl">{item.emoji}</div>
              <div className="flex-1">
                <p className="font-semibold text-[#1E1B4B] text-sm">{item.task}</p>
                <p className="text-xs text-gray-400 mt-0.5">Ребёнок: {item.child}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-500">{item.stars} ⭐</div>
                <div className={`text-xs font-semibold mt-0.5 ${item.status === "done" ? "text-green-500" : "text-gray-400"}`}>
                  {item.status === "done" ? "✓ Выполнено" : "В ожидании"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {parentTab === "rewards" && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1E1B4B]">Магазин наград</h2>
            <button className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm">
              + Добавить
            </button>
          </div>
          {SHOP_ITEMS.map((item, i) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="text-2xl">{item.emoji}</div>
              <div className="flex-1">
                <p className="font-semibold text-[#1E1B4B] text-sm">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">Стоимость: {item.cost} ⭐</p>
              </div>
              <button className="text-gray-400 hover:text-red-400 transition-colors">
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {parentTab === "stats" && (
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

          {/* Children with level bars */}
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
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">XP до ур. {cLevel + 1}: {xpInLevel}/10</p>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700"
                        style={{ width: `${xpPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {parentTab === "children" && (
        <div className="animate-fade-in space-y-4">
          <h2 className="text-lg font-bold text-[#1E1B4B]">Мои дети</h2>
          {CHILDREN.map(child => {
            const { level: cLevel, xpPct } = getLevelInfo(child.stars);
            const cEmoji = getLevelEmoji(cLevel);
            const pct = child.tasksTotal > 0 ? Math.round(child.tasksDone / child.tasksTotal * 100) : 0;
            return (
              <div key={child.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#6B7BFF]/20 to-[#9B6BFF]/20 rounded-2xl flex items-center justify-center text-3xl">
                    {child.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1E1B4B] text-lg">{child.name}</p>
                    <p className="text-sm text-gray-400">{child.age} лет</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-500 font-black text-xl">{child.stars}⭐</p>
                    <div className="flex items-center gap-1 justify-end">
                      <span>{cEmoji}</span>
                      <span className="text-sm font-bold text-[#6B7BFF]">ур. {cLevel}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Задачи выполнены</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Опыт до ур. {cLevel + 1}</span>
                      <span>{Math.round(xpPct)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700"
                        style={{ width: `${xpPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {parentTab === "profile" && (
        <div className="animate-fade-in">
          <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-6 text-center text-white shadow-lg mb-4">
            <div className="text-6xl mb-3">👨</div>
            <h2 className="text-2xl font-black">Андрей Иванов</h2>
            <p className="opacity-80 font-bold mt-1">{CHILDREN.length} {CHILDREN.length === 1 ? "ребёнок" : "детей"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Детей", value: CHILDREN.length, emoji: "👨‍👧‍👦" },
              { label: "Задач создано", value: PARENT_TASKS_LIST.length, emoji: "📋" },
              { label: "Выполнено", value: PARENT_TASKS_LIST.filter(t => t.status === "done").length, emoji: "✅" },
              { label: "Дней в системе", value: 14, emoji: "📅" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/90 rounded-3xl p-4 text-center shadow-sm">
                <div className="text-3xl mb-1">{stat.emoji}</div>
                <div className="text-2xl font-black text-[#1E1B4B]">{stat.value}</div>
                <div className="text-xs font-bold text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parent bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-3 py-2 flex gap-1 border border-white">
          {([
            { key: "tasks", emoji: "📋", label: "Задачи" },
            { key: "rewards", emoji: "🎁", label: "Награды" },
            { key: "stats", emoji: "📊", label: "Стат." },
            { key: "children", emoji: "👨‍👧", label: "Дети" },
            { key: "profile", emoji: "👤", label: "Профиль" },
          ] as { key: ParentTab; emoji: string; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setParentTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-300 ${
                parentTab === tab.key
                  ? "bg-gradient-to-b from-[#6B7BFF] to-[#9B6BFF] scale-110 shadow-md"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-xs font-black ${parentTab === tab.key ? "text-white" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
