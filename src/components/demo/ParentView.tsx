import Icon from "@/components/ui/icon";
import { ParentXpBar } from "./XpBar";
import {
  getLevelInfo, getLevelEmoji,
  getParentLevelInfo, getParentLevelTier,
  SHOP_ITEMS, PARENT_TASKS_LIST, CHILDREN,
  PARTNER_PRIZES, PARENT_ACTION_LABELS, PARENT_ACTION_XP,
  getParentTip,
  type ParentAction, type ParentTab,
} from "./types";

type Props = {
  parentTab: ParentTab;
  setParentTab: (tab: ParentTab) => void;
  parentXp: number;
  parentPoints: number;
  confirmedTasks: number[];
  purchasedPrizes: number[];
  onAction: (action: ParentAction) => void;
  onConfirmTask: (taskId: number) => void;
  onBuyPrize: (prizeId: number, cost: number) => void;
};

export default function ParentView({
  parentTab,
  setParentTab,
  parentXp,
  parentPoints,
  confirmedTasks,
  purchasedPrizes,
  onAction,
  onConfirmTask,
  onBuyPrize,
}: Props) {
  const { level } = getParentLevelInfo(parentXp);
  const tier = getParentLevelTier(level);
  const tip = getParentTip(level);

  return (
    <div className="max-w-md mx-auto px-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500 font-medium">Добро пожаловать</p>
            <h1 className="text-2xl font-bold text-[#1E1B4B]">Андрей Иванов</h1>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-2xl flex items-center justify-center text-2xl shadow-md">
              👨
            </div>
            <span className="text-xs font-bold text-[#6B7BFF]">{tier.emoji} {tier.title}</span>
          </div>
        </div>
        <ParentXpBar xp={parentXp} points={parentPoints} />
      </div>

      {/* Personal tip */}
      <div className="bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 border border-[#6B7BFF]/20 rounded-2xl px-4 py-3 mb-4 flex gap-3 items-start">
        <span className="text-2xl mt-0.5">💡</span>
        <div>
          <p className="text-xs font-bold text-[#6B7BFF] uppercase tracking-wide mb-0.5">Совет уровня {level}</p>
          <p className="text-sm text-gray-600">{tip}</p>
        </div>
      </div>

      {/* Actions XP panel */}
      {parentTab === "tasks" && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1E1B4B]">Задачи</h2>
            <button
              onClick={() => onAction("task_create")}
              className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              + Добавить
            </button>
          </div>

          {/* XP hint */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-xs font-bold text-[#1E1B4B]">Зарабатывайте XP за действия</p>
              <p className="text-xs text-gray-400">Создание задачи +{PARENT_ACTION_XP.task_create} XP · Подтверждение +{PARENT_ACTION_XP.task_confirm} XP</p>
            </div>
          </div>

          {PARENT_TASKS_LIST.map((item, i) => {
            const isDone = confirmedTasks.includes(item.id) || item.status === "done";
            return (
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
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="text-sm font-bold text-amber-500">{item.stars} ⭐</div>
                  {isDone ? (
                    <span className="text-xs font-semibold text-green-500">✓ Выполнено</span>
                  ) : (
                    <button
                      onClick={() => onConfirmTask(item.id)}
                      className="text-xs bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-lg hover:bg-green-200 transition-colors active:scale-95"
                    >
                      Подтвердить
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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

      {parentTab === "bonuses" && (
        <div className="animate-fade-in space-y-4">
          {/* Balance card */}
          <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-5 text-white shadow-lg">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Ваш баланс</p>
            <p className="text-4xl font-black">{parentPoints.toLocaleString()} <span className="text-2xl font-bold">баллов</span></p>
            <p className="text-white/70 text-xs mt-2">+{PARENT_POINTS_PER_LEVEL_DISPLAY} баллов за каждый новый уровень</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-lg">{tier.emoji}</span>
              <span className="text-sm font-bold">{tier.badge}</span>
            </div>
          </div>

          {/* How to earn */}
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B] mb-3">Как зарабатывать баллы</h3>
            <div className="space-y-2">
              {(Object.keys(PARENT_ACTION_LABELS) as ParentAction[]).map(action => (
                <div key={action} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                  <span className="text-xl">{PARENT_ACTION_LABELS[action].emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1E1B4B]">{PARENT_ACTION_LABELS[action].label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#6B7BFF]">+{PARENT_ACTION_XP[action]} XP</p>
                  </div>
                </div>
              ))}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1E1B4B]">Новый уровень</p>
                  <p className="text-xs text-gray-400">Автоматически при наборе XP</p>
                </div>
                <p className="text-xs font-bold text-amber-600">+1 000 баллов</p>
              </div>
            </div>
          </div>

          {/* Prize store */}
          <div>
            <h3 className="text-base font-bold text-[#1E1B4B] mb-3">Магазин призов</h3>
            <div className="space-y-3">
              {PARTNER_PRIZES.map((prize, i) => {
                const bought = purchasedPrizes.includes(prize.id);
                const canBuy = parentPoints >= prize.cost && !bought;
                return (
                  <div
                    key={prize.id}
                    className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${bought ? "border-green-200 opacity-70" : "border-gray-100 hover:shadow-md"}`}
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{prize.emoji}</div>
                      <div className="flex-1">
                        <p className="font-bold text-[#1E1B4B] text-sm">{prize.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">от {prize.partner}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            prize.type === "coupon" ? "bg-blue-100 text-blue-600" :
                            prize.type === "ticket" ? "bg-purple-100 text-purple-600" :
                            prize.type === "promo" ? "bg-green-100 text-green-600" :
                            prize.type === "gift" ? "bg-pink-100 text-pink-600" :
                            "bg-amber-100 text-amber-600"
                          }`}>
                            {prize.type === "coupon" ? "Скидка" :
                             prize.type === "ticket" ? "Билет" :
                             prize.type === "promo" ? "Промокод" :
                             prize.type === "gift" ? "Подарок" : "Сертификат"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="text-sm font-black text-amber-600">{prize.cost.toLocaleString()} б.</p>
                        {bought ? (
                          <span className="text-xs font-bold text-green-500">✓ Получено</span>
                        ) : (
                          <button
                            onClick={() => onBuyPrize(prize.id, prize.cost)}
                            disabled={!canBuy}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all active:scale-95 ${
                              canBuy
                                ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm hover:shadow-md"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Обменять
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
      )}

      {parentTab === "children" && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1E1B4B]">Мои дети</h2>
            <button
              onClick={() => onAction("child_add")}
              className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              + Добавить
            </button>
          </div>

          <button
            onClick={() => onAction("invite_relative")}
            className="w-full bg-white border-2 border-dashed border-[#6B7BFF]/40 rounded-2xl p-4 flex items-center gap-3 hover:border-[#6B7BFF] transition-colors group"
          >
            <span className="text-2xl">👨‍👩‍👧</span>
            <div className="flex-1 text-left">
              <p className="font-bold text-[#1E1B4B] text-sm">Пригласить родственника</p>
              <p className="text-xs text-gray-400">Бабушка, дедушка, тёти и дяди</p>
            </div>
            <span className="text-xs font-bold text-[#6B7BFF] group-hover:translate-x-1 transition-transform">
              +{PARENT_ACTION_XP.invite_relative} XP →
            </span>
          </button>

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
                      <span>Задачи выполнены</span><span>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Опыт до ур. {cLevel + 1}</span><span>{Math.round(xpPct)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
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

          {/* Level achievements */}
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
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-2 py-2 flex gap-0.5 border border-white">
          {([
            { key: "tasks",    emoji: "📋", label: "Задачи" },
            { key: "rewards",  emoji: "🎁", label: "Награды" },
            { key: "bonuses",  emoji: "🏅", label: "Бонусы" },
            { key: "children", emoji: "👨‍👧", label: "Дети" },
            { key: "profile",  emoji: "👤", label: "Профиль" },
          ] as { key: ParentTab; emoji: string; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setParentTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-300 relative ${
                parentTab === tab.key
                  ? "bg-gradient-to-b from-[#6B7BFF] to-[#9B6BFF] scale-110 shadow-md"
                  : "hover:bg-gray-50"
              }`}
            >
              {tab.key === "bonuses" && parentPoints > 0 && parentTab !== "bonuses" && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full text-[9px] font-black text-white flex items-center justify-center">!</span>
              )}
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-[10px] font-black ${parentTab === tab.key ? "text-white" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const PARENT_POINTS_PER_LEVEL_DISPLAY = "1 000";
