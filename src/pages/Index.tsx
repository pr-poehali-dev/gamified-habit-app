import { useState } from "react";
import Icon from "@/components/ui/icon";

type Mode = "child" | "parent";
type ChildTab = "tasks" | "stars" | "shop" | "profile";
type ParentTab = "tasks" | "rewards" | "stats" | "children" | "profile";

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

  const handleTaskToggle = (taskId: number, taskStars: number) => {
    if (completedTasks.includes(taskId)) return;
    setCompletedTasks(prev => [...prev, taskId]);
    setStarCount(prev => prev + taskStars);
    setShowStar(true);
    setTimeout(() => setShowStar(false), 1000);
  };

  const handleBuy = (itemId: number, cost: number) => {
    if (starCount < cost || purchasedItems.includes(itemId)) return;
    setPurchasedItems(prev => [...prev, itemId]);
    setStarCount(prev => prev - cost);
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        mode === "child"
          ? "bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]"
          : "bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF]"
      }`}
      style={{ fontFamily: mode === "child" ? "Nunito, sans-serif" : "Golos Text, sans-serif" }}
    >
      {showStar && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
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
          <div className="mt-6 mb-5 text-center">
            <div className="text-5xl mb-2 animate-float inline-block">🌟</div>
            <h1 className="text-2xl font-black text-[#2D1B69]">Привет, Маша!</h1>
            <div className="inline-flex items-center gap-2 mt-2 bg-white/80 rounded-2xl px-5 py-2.5 shadow-sm">
              <span className="text-2xl">⭐</span>
              <span className="text-2xl font-black text-[#FF6B9D]">{starCount}</span>
              <span className="text-sm font-bold text-gray-500">звёзд</span>
            </div>
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
              <div className="bg-gradient-to-br from-[#FFD700] to-[#FF9500] rounded-3xl p-6 text-center mb-5 shadow-lg">
                <div className="text-7xl mb-2">⭐</div>
                <div className="text-5xl font-black text-white">{starCount}</div>
                <div className="text-white/80 font-bold mt-1">звёзд собрано</div>
              </div>
              <div className="bg-white/90 rounded-3xl p-5 shadow-sm">
                <div className="flex justify-between text-sm font-bold text-gray-500 mb-2">
                  <span>До следующей награды</span>
                  <span className="text-[#FF6B9D]">{30 - (starCount % 30)}/30 ⭐</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] rounded-full transition-all duration-500"
                    style={{ width: `${((starCount % 30) / 30) * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-5">
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
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Звёзд", value: starCount, emoji: "⭐" },
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
                  { label: "Активных задач", value: "3", sub: "в работе", color: "from-purple-500 to-pink-500" },
                ].map(card => (
                  <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-md`}>
                    <div className="text-3xl font-bold">{card.value}</div>
                    <div className="text-sm font-semibold mt-1 opacity-90">{card.label}</div>
                    <div className="text-xs opacity-70">{card.sub}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-[#1E1B4B] mb-3">Активность детей</h3>
                {CHILDREN.map(child => (
                  <div key={child.id} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-[#1E1B4B]">{child.avatar} {child.name}</span>
                      <span className="text-gray-400">{child.tasksDone}/{child.tasksTotal} задач</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] rounded-full transition-all"
                        style={{ width: `${(child.tasksDone / child.tasksTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parentTab === "children" && (
            <div className="animate-fade-in space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1E1B4B]">Мои дети</h2>
                <button className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm">
                  + Добавить
                </button>
              </div>
              {CHILDREN.map(child => (
                <div key={child.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl">
                      {child.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1E1B4B]">{child.name}</h3>
                      <p className="text-sm text-gray-400">{child.age} лет</p>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-xl font-bold text-amber-500">{child.stars} ⭐</div>
                      <div className="text-xs text-gray-400">звёзд</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-[#1E1B4B]">{child.tasksDone}</div>
                      <div className="text-xs text-gray-400">выполнено</div>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-lg font-bold text-[#1E1B4B]">{child.tasksTotal - child.tasksDone}</div>
                      <div className="text-xs text-gray-400">в работе</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {parentTab === "profile" && (
            <div className="animate-fade-in space-y-4">
              <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">👨</div>
                  <div>
                    <h2 className="text-xl font-bold">Андрей Иванов</h2>
                    <p className="opacity-75 text-sm">andrey@example.com</p>
                  </div>
                </div>
              </div>
              {[
                { icon: "Users", label: "Детей в системе", value: "2" },
                { icon: "ClipboardList", label: "Всего задач создано", value: "17" },
                { icon: "Gift", label: "Наград добавлено", value: "4" },
                { icon: "Calendar", label: "Дней в системе", value: "14" },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Icon name={item.icon} size={18} className="text-[#6B7BFF]" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-[#1E1B4B]">{item.label}</span>
                  <span className="font-bold text-[#6B7BFF]">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Parent bottom nav */}
          <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl px-2 py-2 flex gap-1 border border-gray-100">
              {([
                { key: "tasks", icon: "ClipboardList", label: "Задачи" },
                { key: "rewards", icon: "Gift", label: "Награды" },
                { key: "stats", icon: "BarChart2", label: "Статистика" },
                { key: "children", icon: "Users", label: "Дети" },
                { key: "profile", icon: "User", label: "Профиль" },
              ] as { key: ParentTab; icon: string; label: string }[]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setParentTab(tab.key)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-300 ${
                    parentTab === tab.key
                      ? "bg-gradient-to-b from-[#6B7BFF] to-[#9B6BFF] shadow-md"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    name={tab.icon}
                    size={18}
                    className={parentTab === tab.key ? "text-white" : "text-gray-400"}
                  />
                  <span className={`text-xs font-semibold ${parentTab === tab.key ? "text-white" : "text-gray-400"}`}>
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