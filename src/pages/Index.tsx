import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

type Mode = "child" | "parent";
type ChildTab = "tasks" | "stars" | "shop" | "profile";
type ParentTab = "tasks" | "rewards" | "stats" | "children" | "profile";

const STARS_PER_LEVEL = 10;

function getLevelInfo(totalStars: number) {
  const level = Math.floor(totalStars / STARS_PER_LEVEL) + 1;
  const xpInLevel = totalStars % STARS_PER_LEVEL;
  const xpPct = (xpInLevel / STARS_PER_LEVEL) * 100;
  return { level, xpInLevel, xpPct };
}

function getLevelEmoji(level: number) {
  if (level >= 20) return "🏆";
  if (level >= 15) return "💎";
  if (level >= 10) return "🥇";
  if (level >= 7) return "🥈";
  if (level >= 4) return "🥉";
  return "⭐";
}

function XpBar({ stars }: { stars: number }) {
  const { level, xpInLevel, xpPct } = getLevelInfo(stars);
  const emoji = getLevelEmoji(level);
  const left = STARS_PER_LEVEL - xpInLevel;

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{emoji}</span>
          <span className="font-black text-[#2D1B69] text-sm">Уровень {level}</span>
        </div>
        <span className="text-gray-400 text-xs font-semibold">
          {left === 0 ? "🎉 Новый уровень!" : `⚡ Ещё ${left} ${left === 1 ? "звезда" : left < 5 ? "звезды" : "звёзд"} до ур. ${level + 1}`}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full transition-all duration-700"
          style={{ width: `${xpPct}%` }}
        />
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(p => (
          <div key={p} className="absolute top-0 bottom-0 w-px bg-white/60" style={{ left: `${p}%` }} />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-gray-300">0%</span>
        <span className="text-[9px] text-gray-400 font-semibold">{xpInLevel}/10 XP</span>
        <span className="text-[9px] text-gray-300">100%</span>
      </div>
    </div>
  );
}

function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  const emoji = getLevelEmoji(level);
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-8 text-center shadow-2xl w-full max-w-xs"
        style={{ animation: "levelUpPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div className="text-7xl mb-3" style={{ animation: "spinOnce 0.6s ease-out 0.2s both" }}>
          {emoji}
        </div>
        <p className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-1">Новый уровень!</p>
        <p className="text-white text-5xl font-black mb-2">{level}</p>
        <p className="text-white/90 text-base font-semibold">Так держать! Ты становишься лучше!</p>
        <div className="mt-5 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-2xl" style={{ animation: `starPop 0.4s ease-out ${0.4 + i * 0.08}s both` }}>
              ⭐
            </span>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-5 bg-white/30 text-white font-bold rounded-2xl px-6 py-2 text-sm active:scale-95 transition-transform"
        >
          Ура! 🎉
        </button>
      </div>
    </div>
  );
}

const CHILD_TASKS = [
  { id: 1, title: "Убрать комнату", stars: 3, emoji: "🧹" },
  { id: 2, title: "Сделать домашнее задание", stars: 5, emoji: "📚" },
  { id: 3, title: "Почистить зубы", stars: 1, emoji: "🦷" },
  { id: 4, title: "Вынести мусор", stars: 2, emoji: "🗑️" },
  { id: 5, title: "Прочитать 20 страниц", stars: 4, emoji: "📖" },
];

const SHOP_ITEMS = [
  { id: 1, title: "Поход в кино", cost: 30, emoji: "🎬" },
  { id: 2, title: "Новая игрушка", cost: 50, emoji: "🎮" },
  { id: 3, title: "Пицца на ужин", cost: 20, emoji: "🍕" },
  { id: 4, title: "Лишний час игр", cost: 15, emoji: "⏰" },
];

const PARENT_TASKS_LIST = [
  { id: 1, child: "Маша", task: "Убрать комнату", stars: 3, status: "done", emoji: "🧹" },
  { id: 2, child: "Вася", task: "Сделать домашку", stars: 5, status: "pending", emoji: "📚" },
  { id: 3, child: "Маша", task: "Полить цветы", stars: 2, status: "pending", emoji: "🌸" },
  { id: 4, child: "Вася", task: "Вынести мусор", stars: 2, status: "done", emoji: "🗑️" },
];

const CHILDREN = [
  { id: 1, name: "Маша", age: 9, stars: 47, avatar: "👧", tasksTotal: 12, tasksDone: 8 },
  { id: 2, name: "Вася", age: 7, stars: 31, avatar: "👦", tasksTotal: 10, tasksDone: 5 },
];

export default function Index() {
  const [mode, setMode] = useState<Mode>("child");
  const [childTab, setChildTab] = useState<ChildTab>("tasks");
  const [parentTab, setParentTab] = useState<ParentTab>("tasks");
  const [completedTasks, setCompletedTasks] = useState<number[]>([1, 3]);
  const [purchasedItems, setPurchasedItems] = useState<number[]>([]);
  const [showStar, setShowStar] = useState(false);
  const [starCount, setStarCount] = useState(15);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevLevelRef = useRef(getLevelInfo(15).level);

  const updateStars = useCallback((newStars: number) => {
    const newLevel = getLevelInfo(newStars).level;
    if (newLevel > prevLevelRef.current) {
      setLevelUpLevel(newLevel);
    }
    prevLevelRef.current = newLevel;
    setStarCount(newStars);
  }, []);

  const handleTaskToggle = (taskId: number, taskStars: number) => {
    if (completedTasks.includes(taskId)) return;
    setCompletedTasks(prev => [...prev, taskId]);
    updateStars(starCount + taskStars);
    setShowStar(true);
    setTimeout(() => setShowStar(false), 1000);
  };

  const handleBuy = (itemId: number, cost: number) => {
    if (starCount < cost || purchasedItems.includes(itemId)) return;
    setPurchasedItems(prev => [...prev, itemId]);
    updateStars(starCount - cost);
  };

  const { level } = getLevelInfo(starCount);
  const levelEmoji = getLevelEmoji(level);

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        mode === "child"
          ? "bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]"
          : "bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF]"
      }`}
      style={{ fontFamily: mode === "child" ? "Nunito, sans-serif" : "Golos Text, sans-serif" }}
    >
      {levelUpLevel !== null && (
        <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />
      )}

      {showStar && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div className="text-8xl animate-star-pop">⭐</div>
        </div>
      )}

      {/* Mode switcher */}
      <div className="flex justify-center pt-5 px-4">
        <div
          className="flex rounded-2xl p-1 gap-1 shadow-lg"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)" }}
        >
          <button
            onClick={() => setMode("child")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              mode === "child"
                ? "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white shadow-md scale-105"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            👧 Ребёнок
          </button>
          <button
            onClick={() => setMode("parent")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              mode === "parent"
                ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-md scale-105"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            👨 Родитель
          </button>
        </div>
      </div>

      {/* ========== CHILD MODE ========== */}
      {mode === "child" && (
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
                <div className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">Текущий уровень</div>
                <div className="text-white text-4xl font-black">{level}</div>
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
                <XpBar stars={starCount} />
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
      )}

      {/* ========== PARENT MODE ========== */}
      {mode === "parent" && (
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
      )}
    </div>
  );
}
