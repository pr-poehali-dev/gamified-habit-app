export type Mode = "child" | "parent";
export type ChildTab = "tasks" | "stars" | "shop" | "profile";
export type ParentTab = "tasks" | "rewards" | "stats" | "children" | "profile";

export const STARS_PER_LEVEL = 10;

export function getLevelInfo(totalStars: number) {
  const level = Math.floor(totalStars / STARS_PER_LEVEL) + 1;
  const xpInLevel = totalStars % STARS_PER_LEVEL;
  const xpPct = (xpInLevel / STARS_PER_LEVEL) * 100;
  return { level, xpInLevel, xpPct };
}

export const LEVEL_TIERS = [
  { from: 1,  emoji: "⭐", title: "Новичок" },
  { from: 4,  emoji: "🥉", title: "Бронза" },
  { from: 7,  emoji: "🥈", title: "Серебро" },
  { from: 10, emoji: "🥇", title: "Золото" },
  { from: 15, emoji: "💎", title: "Алмаз" },
  { from: 20, emoji: "🏆", title: "Чемпион" },
];

export function getLevelEmoji(level: number) {
  const tier = [...LEVEL_TIERS].reverse().find(t => level >= t.from);
  return tier?.emoji ?? "⭐";
}

export function getLevelTier(level: number) {
  return [...LEVEL_TIERS].reverse().find(t => level >= t.from) ?? LEVEL_TIERS[0];
}

export function getNextTier(level: number) {
  return LEVEL_TIERS.find(t => t.from > level) ?? null;
}

export const CHILD_TASKS = [
  { id: 1, title: "Убрать комнату", stars: 3, emoji: "🧹" },
  { id: 2, title: "Сделать домашнее задание", stars: 5, emoji: "📚" },
  { id: 3, title: "Почистить зубы", stars: 1, emoji: "🦷" },
  { id: 4, title: "Вынести мусор", stars: 2, emoji: "🗑️" },
  { id: 5, title: "Прочитать 20 страниц", stars: 4, emoji: "📖" },
];

export const SHOP_ITEMS = [
  { id: 1, title: "Поход в кино", cost: 30, emoji: "🎬" },
  { id: 2, title: "Новая игрушка", cost: 50, emoji: "🎮" },
  { id: 3, title: "Пицца на ужин", cost: 20, emoji: "🍕" },
  { id: 4, title: "Лишний час игр", cost: 15, emoji: "⏰" },
];

export const PARENT_TASKS_LIST = [
  { id: 1, child: "Маша", task: "Убрать комнату", stars: 3, status: "done", emoji: "🧹" },
  { id: 2, child: "Вася", task: "Сделать домашку", stars: 5, status: "pending", emoji: "📚" },
  { id: 3, child: "Маша", task: "Полить цветы", stars: 2, status: "pending", emoji: "🌸" },
  { id: 4, child: "Вася", task: "Вынести мусор", stars: 2, status: "done", emoji: "🗑️" },
];

export const CHILDREN = [
  { id: 1, name: "Маша", age: 9, stars: 47, avatar: "👧", tasksTotal: 12, tasksDone: 8 },
  { id: 2, name: "Вася", age: 7, stars: 31, avatar: "👦", tasksTotal: 10, tasksDone: 5 },
];
