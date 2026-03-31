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

// ─── Parent XP System ────────────────────────────────────────────────────────

export const PARENT_XP_PER_LEVEL = 100;
export const PARENT_POINTS_PER_LEVEL = 1000;

export type ParentAction =
  | "task_create"
  | "task_confirm"
  | "child_add"
  | "invite_relative";

export const PARENT_ACTION_XP: Record<ParentAction, number> = {
  task_create: 20,
  task_confirm: 30,
  child_add: 50,
  invite_relative: 40,
};

export const PARENT_ACTION_LABELS: Record<ParentAction, { label: string; emoji: string }> = {
  task_create: { label: "Создать задачу", emoji: "📝" },
  task_confirm: { label: "Подтвердить выполнение", emoji: "✅" },
  child_add: { label: "Добавить ребёнка", emoji: "👶" },
  invite_relative: { label: "Пригласить родственника", emoji: "👨‍👩‍👧" },
};

export const PARENT_LEVEL_TIERS = [
  { from: 1,  emoji: "🌱", title: "Новичок",    badge: "Начинающий родитель" },
  { from: 3,  emoji: "🥉", title: "Бронза",     badge: "Активный родитель" },
  { from: 5,  emoji: "🥈", title: "Серебро",    badge: "Опытный наставник" },
  { from: 8,  emoji: "🥇", title: "Золото",     badge: "Мастер воспитания" },
  { from: 12, emoji: "💎", title: "Алмаз",      badge: "Семейный чемпион" },
  { from: 18, emoji: "👑", title: "Легенда",    badge: "Легенда родительства" },
];

export function getParentLevelInfo(totalXp: number) {
  const level = Math.floor(totalXp / PARENT_XP_PER_LEVEL) + 1;
  const xpInLevel = totalXp % PARENT_XP_PER_LEVEL;
  const xpPct = (xpInLevel / PARENT_XP_PER_LEVEL) * 100;
  const totalPoints = (level - 1) * PARENT_POINTS_PER_LEVEL;
  return { level, xpInLevel, xpPct, totalPoints };
}

export function getParentLevelTier(level: number) {
  return [...PARENT_LEVEL_TIERS].reverse().find(t => level >= t.from) ?? PARENT_LEVEL_TIERS[0];
}

export function getParentNextTier(level: number) {
  return PARENT_LEVEL_TIERS.find(t => t.from > level) ?? null;
}

export const PARENT_TIPS: Record<number, string> = {
  1: "Хвалите ребёнка сразу после выполнения задачи — это лучший момент.",
  2: "Разбивайте большие задачи на маленькие шаги — дети легче справляются.",
  3: "Ставьте задачи вместе с ребёнком — он будет чувствовать ответственность.",
  4: "Важен режим: задачи в одно и то же время формируют полезные привычки.",
  5: "Небольшое соревнование между братьями и сёстрами мотивирует обоих.",
  6: "Иногда лучший приз — ваше совместное время, а не вещь.",
  7: "Объясняйте, зачем нужна задача — дети выполняют её охотнее.",
  8: "Давайте ребёнку выбор из 2 задач — он чувствует контроль над ситуацией.",
};

export function getParentTip(level: number): string {
  const key = ((level - 1) % Object.keys(PARENT_TIPS).length) + 1;
  return PARENT_TIPS[key] ?? PARENT_TIPS[1];
}

// ─── Parent Streak System ────────────────────────────────────────────────────

export const STREAK_MAX_DAY = 10;

export type StreakState = {
  current: number;
  lastActivityDate: string;
  claimedToday: boolean;
  longestStreak: number;
};

export function getStreakBonus(day: number): { xp: number; points: number } {
  const clamped = Math.min(day, STREAK_MAX_DAY);
  const xp = Math.round((clamped / STREAK_MAX_DAY) * 100);
  const points = Math.round((clamped / STREAK_MAX_DAY) * 1000);
  return { xp, points };
}

export function getStreakEmoji(day: number): string {
  if (day >= 10) return "🔥";
  if (day >= 7) return "⚡";
  if (day >= 5) return "✨";
  if (day >= 3) return "🌟";
  return "💫";
}

export function getStreakTitle(day: number): string {
  if (day >= 10) return "Легенда!";
  if (day >= 7) return "Горячая серия";
  if (day >= 5) return "На волне";
  if (day >= 3) return "Набираем темп";
  return "Начало серии";
}

export function getTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isStreakAlive(lastDate: string): boolean {
  if (!lastDate) return false;
  const today = new Date();
  const last = new Date(lastDate);
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
  return diffDays <= 1;
}

export function advanceStreak(state: StreakState): StreakState {
  const today = getTodayDateStr();
  if (state.lastActivityDate === today) return state;
  const alive = isStreakAlive(state.lastActivityDate);
  const next = alive ? state.current + 1 : 1;
  return {
    current: next,
    lastActivityDate: today,
    claimedToday: false,
    longestStreak: Math.max(state.longestStreak, next),
  };
}

export const STREAK_DAYS_PREVIEW = Array.from({ length: STREAK_MAX_DAY }, (_, i) => i + 1);

export const PARTNER_PRIZES = [
  { id: 1, title: "Скидка 20% в Детском Мире", cost: 1000, emoji: "🧸", partner: "Детский Мир", type: "coupon" },
  { id: 2, title: "Билеты в кино на семью", cost: 2000, emoji: "🎬", partner: "Синема Парк", type: "ticket" },
  { id: 3, title: "Промокод на пиццу", cost: 1500, emoji: "🍕", partner: "Додо Пицца", type: "promo" },
  { id: 4, title: "Абонемент в спортзал (1 мес.)", cost: 3000, emoji: "💪", partner: "World Class", type: "gift" },
  { id: 5, title: "Сертификат на книги 500₽", cost: 1000, emoji: "📚", partner: "Лабиринт", type: "certificate" },
  { id: 6, title: "Скидка 15% на витамины", cost: 800, emoji: "💊", partner: "iHerb", type: "promo" },
];