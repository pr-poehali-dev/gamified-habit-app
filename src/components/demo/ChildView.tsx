import Icon from "@/components/ui/icon";
import {
  getLevelInfo, getLevelTier, getLevelEmoji, LEVEL_TIERS, STARS_PER_LEVEL,
  CHILD_TASKS, SHOP_ITEMS,
  type ChildTab,
} from "./types";
import { XpBar } from "./XpBar";

type Props = {
  childTab: ChildTab;
  setChildTab: (tab: ChildTab) => void;
  starCount: number;
  completedTasks: number[];
  purchasedItems: number[];
  handleTaskToggle: (taskId: number, taskStars: number) => void;
  handleBuy: (itemId: number, cost: number) => void;
};

export default function ChildView({
  childTab, setChildTab,
  starCount, completedTasks, purchasedItems,
  handleTaskToggle, handleBuy,
}: Props) {
  const { level } = getLevelInfo(starCount);
  const levelEmoji = getLevelEmoji(level);

  return (
    <div className="max-w-md mx-auto px-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-black text-[#2D1B69]">Привет, Маша! 👋</h1>
            <p className="text-sm text-gray-400 font-semibold">Выполняй задания — получай звёзды</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/80 rounded-2xl px-3 py-2 text-center shadow-sm">
              <p className="text-yellow-500 text-xl font-black">{starCount}</p>
              <p className="text-gray-400 text-xs font-bold">звёзд ⭐</p>
            </div>
            <div className="bg-white/80 rounded-2xl px-3 py-2 text-center shadow-sm">
              <p className="text-[#2D1B69] text-xl font-black">{level}</p>
              <p className="text-gray-400 text-xs font-bold">ур. {levelEmoji}</p>
            </div>
          </div>
        </div>
        <XpBar stars={starCount} />
      </div>

      {childTab === "tasks" && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-[#2D1B69] mb-3">Мои задачи</h2>
          {CHILD_TASKS.map((task, i) => {
            const done = completedTasks.includes(task.id);
            return (
              <div
                key={task.id}
                onClick={() => handleTaskToggle(task.id, task.stars)}
                className={`rounded-3xl p-4 flex items-center gap-4 cursor-pointer transition-all duration-300 shadow-sm ${
                  done
                    ? "bg-gradient-to-r from-[#B8F0C8] to-[#D4F7E0] border-2 border-[#6DD88A]"
                    : "bg-white/90 border-2 border-transparent hover:border-[#FF9BE0] hover:shadow-md"
                }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="text-3xl">{task.emoji}</div>
                <div className="flex-1">
                  <p className={`font-bold text-[#2D1B69] ${done ? "line-through opacity-60" : ""}`}>
                    {task.title}
                  </p>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: task.stars }).map((_, j) => (
                      <span key={j} className={`text-sm ${done ? "opacity-60" : ""}`}>⭐</span>
                    ))}
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  done ? "bg-[#6DD88A]" : "border-2 border-gray-200"
                }`}>
                  {done && <Icon name="Check" size={16} className="text-white" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {childTab === "stars" && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-black text-[#2D1B69] mb-4">Мои звёзды</h2>
          <div className="bg-gradient-to-br from-[#FFD700] to-[#FF9500] rounded-3xl p-6 text-center mb-4 shadow-lg">
            <div className="text-7xl mb-2">⭐</div>
            <div className="text-5xl font-black text-white">{starCount}</div>
            <div className="text-white/80 font-bold mt-1">звёзд собрано</div>
          </div>

          {/* Level card */}
          <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-3xl p-5 text-center mb-4 shadow-lg">
            <div className="text-5xl mb-1">{levelEmoji}</div>
            <div className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">{getLevelTier(level).title} · Уровень {level}</div>
            <div className="mt-3">
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-700"
                  style={{ width: `${getLevelInfo(starCount).xpPct}%` }}
                />
              </div>
              <p className="text-white/70 text-xs mt-1.5">
                {getLevelInfo(starCount).xpInLevel}/10 XP · до ур. {level + 1} ещё {STARS_PER_LEVEL - getLevelInfo(starCount).xpInLevel} ⭐
              </p>
            </div>
          </div>

          {/* Tier roadmap */}
          <div className="bg-white/90 rounded-3xl p-4 shadow-sm mb-4">
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Путь к чемпиону</p>
            <div className="flex items-center justify-between">
              {LEVEL_TIERS.map((tier, i) => {
                const reached = level >= tier.from;
                const isCurrent = getLevelTier(level).from === tier.from;
                return (
                  <div key={tier.from} className="flex items-center">
                    <div className={`flex flex-col items-center gap-1 ${reached ? "opacity-100" : "opacity-30"}`}>
                      <div className={`text-2xl transition-all ${isCurrent ? "scale-125 drop-shadow-md" : ""}`}>{tier.emoji}</div>
                      <span className={`text-[9px] font-bold ${isCurrent ? "text-[#FF6B9D]" : "text-gray-400"}`}>{tier.title}</span>
                      <span className="text-[8px] text-gray-300">ур.{tier.from}</span>
                    </div>
                    {i < LEVEL_TIERS.length - 1 && (
                      <div className={`w-5 h-px mx-1 mb-4 ${level >= LEVEL_TIERS[i + 1].from ? "bg-yellow-400" : "bg-gray-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/90 rounded-3xl p-5 shadow-sm mb-4">
            <XpBar stars={starCount} showTierHint />
          </div>

          <div className="bg-white/90 rounded-3xl p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Сегодня", value: "3 ⭐", color: "from-pink-100 to-pink-50" },
                { label: "На неделе", value: "12 ⭐", color: "from-purple-100 to-purple-50" },
                { label: "Всего", value: `${starCount} ⭐`, color: "from-yellow-100 to-yellow-50" },
              ].map(stat => (
                <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-3 text-center`}>
                  <div className="text-lg font-black text-[#2D1B69]">{stat.value}</div>
                  <div className="text-xs text-gray-500 font-bold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {childTab === "shop" && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-black text-[#2D1B69] mb-1">Магазин наград</h2>
          <p className="text-sm text-gray-500 mb-4 font-bold">У тебя {starCount} ⭐ — трать с умом!</p>
          <div className="grid grid-cols-2 gap-3">
            {SHOP_ITEMS.map((item, i) => {
              const bought = purchasedItems.includes(item.id);
              const canBuy = starCount >= item.cost && !bought;
              return (
                <div
                  key={item.id}
                  onClick={() => handleBuy(item.id, item.cost)}
                  className={`rounded-3xl p-4 text-center transition-all duration-300 cursor-pointer shadow-sm ${
                    bought
                      ? "bg-gradient-to-br from-green-100 to-green-50 border-2 border-green-300"
                      : canBuy
                      ? "bg-white/90 hover:shadow-lg hover:scale-105 border-2 border-transparent hover:border-[#FF9BE0]"
                      : "bg-gray-100 opacity-60 border-2 border-transparent"
                  }`}
                  style={{ animationDelay: `${i * 0.07}s` }}
                >
                  <div className="text-4xl mb-2">{item.emoji}</div>
                  <div className="font-black text-[#2D1B69] text-sm leading-tight">{item.title}</div>
                  <div className={`mt-2 font-black text-sm ${bought ? "text-green-600" : canBuy ? "text-[#FF6B9D]" : "text-gray-400"}`}>
                    {bought ? "✅ Куплено" : `${item.cost} ⭐`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {childTab === "profile" && (
        <div className="animate-fade-in">
          <div className="bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B] rounded-3xl p-6 text-center text-white shadow-lg mb-4">
            <div className="text-6xl mb-3">👧</div>
            <h2 className="text-2xl font-black">Маша</h2>
            <p className="opacity-80 font-bold">9 лет</p>
            <div className="mt-3 flex items-center justify-center gap-2 bg-white/20 rounded-2xl px-4 py-2">
              <span className="text-xl">{levelEmoji}</span>
              <span className="font-black text-lg">Уровень {level}</span>
            </div>
          </div>
          <div className="mb-4">
            <XpBar stars={starCount} showTierHint />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Звёзд", value: starCount, emoji: "⭐" },
              { label: "Уровень", value: level, emoji: levelEmoji },
              { label: "Задач выполнено", value: completedTasks.length, emoji: "✅" },
              { label: "Наград куплено", value: purchasedItems.length, emoji: "🎁" },
              { label: "Дней в системе", value: 14, emoji: "📅" },
            ].map(stat => (
              <div key={stat.label} className="bg-white/90 rounded-3xl p-4 text-center shadow-sm">
                <div className="text-3xl mb-1">{stat.emoji}</div>
                <div className="text-2xl font-black text-[#2D1B69]">{stat.value}</div>
                <div className="text-xs font-bold text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Child bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-3 py-2 flex gap-1 border border-white">
          {([
            { key: "tasks", emoji: "📋", label: "Задачи" },
            { key: "stars", emoji: "⭐", label: "Звёзды" },
            { key: "shop", emoji: "🛍️", label: "Магазин" },
            { key: "profile", emoji: "👤", label: "Профиль" },
          ] as { key: ChildTab; emoji: string; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setChildTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-300 ${
                childTab === tab.key
                  ? "bg-gradient-to-b from-[#FF6B9D] to-[#FF9B6B] scale-110 shadow-md"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-xs font-black ${childTab === tab.key ? "text-white" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
