export type Mode = "child" | "parent";
export type ChildTab = "tasks" | "stars" | "shop" | "achievements" | "stickers" | "profile";
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

// ─── Child Achievements ───────────────────────────────────────────────────────

export type AchievementId =
  | "first_task" | "tasks_5" | "tasks_10" | "tasks_25"
  | "stars_10" | "stars_50" | "stars_100"
  | "level_3" | "level_5" | "level_10"
  | "spend_10" | "spend_30"
  | "reward_1" | "reward_3"
  | "streak_3" | "streak_7"
  | "speed_demon";

export type Achievement = {
  id: AchievementId;
  title: string;
  desc: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare" | "mythical" | "legendary";
  check: (s: ChildStats) => boolean;
};

export type ChildStats = {
  tasksCompleted: number;
  totalStars: number;
  level: number;
  starsSpent: number;
  rewardsBought: number;
  streak: number;
  fastTasksDone: number;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_task",  title: "Первый шаг",      desc: "Выполни первое задание",          emoji: "🌱", rarity: "common",    check: s => s.tasksCompleted >= 1 },
  { id: "tasks_5",     title: "Пятёрка",          desc: "Выполни 5 заданий",               emoji: "✋", rarity: "common",    check: s => s.tasksCompleted >= 5 },
  { id: "tasks_10",    title: "Десятка",           desc: "Выполни 10 заданий",              emoji: "🔟", rarity: "uncommon",  check: s => s.tasksCompleted >= 10 },
  { id: "tasks_25",    title: "Трудяга",           desc: "Выполни 25 заданий",              emoji: "💪", rarity: "rare",      check: s => s.tasksCompleted >= 25 },
  { id: "stars_10",    title: "Звёздочка",         desc: "Собери 10 звёзд",                 emoji: "⭐", rarity: "common",    check: s => s.totalStars >= 10 },
  { id: "stars_50",    title: "Звёздный дождь",    desc: "Собери 50 звёзд",                 emoji: "🌟", rarity: "uncommon",  check: s => s.totalStars >= 50 },
  { id: "stars_100",   title: "Звёздный король",   desc: "Собери 100 звёзд",               emoji: "👑", rarity: "legendary", check: s => s.totalStars >= 100 },
  { id: "level_3",     title: "Растём!",           desc: "Достигни 3-го уровня",            emoji: "📈", rarity: "common",    check: s => s.level >= 3 },
  { id: "level_5",     title: "Середнячок",        desc: "Достигни 5-го уровня",            emoji: "🥈", rarity: "uncommon",  check: s => s.level >= 5 },
  { id: "level_10",    title: "Мастер",            desc: "Достигни 10-го уровня",           emoji: "🏆", rarity: "mythical",  check: s => s.level >= 10 },
  { id: "spend_10",    title: "Транжира",          desc: "Потрать 10 звёзд",                emoji: "💸", rarity: "common",    check: s => s.starsSpent >= 10 },
  { id: "spend_30",    title: "Шопоголик",         desc: "Потрать 30 звёзд",                emoji: "🛍️", rarity: "uncommon",  check: s => s.starsSpent >= 30 },
  { id: "reward_1",    title: "Первая награда",    desc: "Купи первую награду",             emoji: "🎁", rarity: "common",    check: s => s.rewardsBought >= 1 },
  { id: "reward_3",    title: "Коллекционер",      desc: "Купи 3 награды",                  emoji: "🗃️", rarity: "rare",      check: s => s.rewardsBought >= 3 },
  { id: "streak_3",    title: "Регулярность",      desc: "3 дня подряд без пропусков",      emoji: "🔥", rarity: "uncommon",  check: s => s.streak >= 3 },
  { id: "streak_7",    title: "Железная воля",     desc: "7 дней подряд без пропусков",     emoji: "⚡", rarity: "mythical",  check: s => s.streak >= 7 },
  { id: "speed_demon", title: "Молния",            desc: "Выполни задачу мгновенно",        emoji: "⚡", rarity: "rare",      check: s => s.fastTasksDone >= 1 },
];

export const RARITY_CONFIG = {
  common:    { label: "Common",    color: "#9CA3AF", bg: "from-gray-100 to-gray-50",   border: "border-gray-200",   glow: ""                              },
  uncommon:  { label: "Uncommon",  color: "#10B981", bg: "from-green-100 to-emerald-50", border: "border-green-300", glow: "shadow-green-200"              },
  rare:      { label: "Rare",      color: "#6B7BFF", bg: "from-blue-100 to-indigo-50", border: "border-indigo-300", glow: "shadow-indigo-200"              },
  mythical:  { label: "Mythical",  color: "#D946EF", bg: "from-purple-100 to-pink-50", border: "border-purple-400", glow: "shadow-purple-200"             },
  legendary: { label: "Legendary", color: "#F59E0B", bg: "from-yellow-100 to-amber-50", border: "border-yellow-400", glow: "shadow-yellow-200 shadow-md"  },
} as const;

export function checkAchievements(stats: ChildStats, already: AchievementId[]): AchievementId[] {
  return ACHIEVEMENTS
    .filter(a => !already.includes(a.id) && a.check(stats))
    .map(a => a.id);
}

// ─── Child Stickers ───────────────────────────────────────────────────────────

export type StickerRarity = "common" | "uncommon" | "rare" | "mythical" | "legendary";

export type Sticker = {
  id: string;
  name: string;
  emoji: string;
  rarity: StickerRarity;
  description: string;
  avatarOverride?: string;
  animationClass?: string;
};

export const ALL_STICKERS: Sticker[] = [
  // Common (6)
  { id: "s_sun",      name: "Солнышко",      emoji: "☀️",  rarity: "common",    description: "Яркое и позитивное" },
  { id: "s_star",     name: "Звёздочка",     emoji: "⭐",  rarity: "common",    description: "За каждую звезду" },
  { id: "s_pencil",   name: "Карандашик",    emoji: "✏️",  rarity: "common",    description: "Любитель учёбы" },
  { id: "s_apple",    name: "Яблоко",        emoji: "🍎",  rarity: "common",    description: "Здоровый выбор" },
  { id: "s_book",     name: "Книжка",        emoji: "📚",  rarity: "common",    description: "Читатель" },
  { id: "s_heart",    name: "Сердечко",      emoji: "❤️",  rarity: "common",    description: "С любовью" },
  // Uncommon (5)
  { id: "s_rocket",   name: "Ракета",        emoji: "🚀",  rarity: "uncommon",  description: "К звёздам!" },
  { id: "s_rainbow",  name: "Радуга",        emoji: "🌈",  rarity: "uncommon",  description: "После дождя" },
  { id: "s_crown",    name: "Корона",        emoji: "👑",  rarity: "uncommon",  description: "Маленький король" },
  { id: "s_dino",     name: "Динозаврик",    emoji: "🦕",  rarity: "uncommon",  description: "Доисторический друг" },
  { id: "s_planet",   name: "Планета",       emoji: "🪐",  rarity: "uncommon",  description: "Покоритель космоса" },
  // Rare (4)
  { id: "s_dragon",   name: "Дракончик",     emoji: "🐉",  rarity: "rare",      description: "Огнедышащий!" },
  { id: "s_wizard",   name: "Волшебник",     emoji: "🧙",  rarity: "rare",      description: "Мастер магии" },
  { id: "s_diamond",  name: "Алмаз",         emoji: "💎",  rarity: "rare",      description: "Настоящая ценность" },
  { id: "s_phoenix",  name: "Феникс",        emoji: "🦅",  rarity: "rare",      description: "Возрождается снова" },
  // Mythical (3)
  { id: "s_unicorn",  name: "Единорог",      emoji: "🦄",  rarity: "mythical",  description: "Легендарное существо" },
  { id: "s_ghost",    name: "Призрак",       emoji: "👻",  rarity: "mythical",  description: "Таинственный дух", animationClass: "animate-bounce" },
  { id: "s_crystal",  name: "Кристалл",      emoji: "🔮",  rarity: "mythical",  description: "Видит будущее" },
  // Legendary (2) — дают аватар-оверрайд
  { id: "s_alien",    name: "Инопланетянин", emoji: "👽",  rarity: "legendary", description: "Из другой галактики", avatarOverride: "👽", animationClass: "animate-pulse" },
  { id: "s_ninja",    name: "Ниндзя",        emoji: "🥷",  rarity: "legendary", description: "Невидимый мастер",   avatarOverride: "🥷", animationClass: "animate-bounce" },
];

export const STICKER_DROP_POOL: Record<StickerRarity, number> = {
  common: 50, uncommon: 25, rare: 15, mythical: 8, legendary: 2,
};

export function rollSticker(): Sticker {
  const roll = Math.random() * 100;
  let rarity: StickerRarity;
  if (roll < 50) rarity = "common";
  else if (roll < 75) rarity = "uncommon";
  else if (roll < 90) rarity = "rare";
  else if (roll < 98) rarity = "mythical";
  else rarity = "legendary";
  const pool = ALL_STICKERS.filter(s => s.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Child Status ─────────────────────────────────────────────────────────────

export type ChildStatus = {
  emoji: string;
  label: string;
  color: string;
};

export const CHILD_STATUSES: ChildStatus[] = [
  { emoji: "🌱", label: "Росток",       color: "#10B981" },
  { emoji: "⚡", label: "Энергичный",   color: "#F59E0B" },
  { emoji: "📚", label: "Умник",        color: "#6B7BFF" },
  { emoji: "🔥", label: "На волне",     color: "#EF4444" },
  { emoji: "🏆", label: "Чемпион",      color: "#D946EF" },
  { emoji: "🚀", label: "Ракета",       color: "#8B5CF6" },
];

export function getChildStatus(tasksCompleted: number, level: number): ChildStatus {
  if (level >= 10) return CHILD_STATUSES[5];
  if (level >= 7)  return CHILD_STATUSES[4];
  if (level >= 5)  return CHILD_STATUSES[3];
  if (tasksCompleted >= 10) return CHILD_STATUSES[2];
  if (tasksCompleted >= 5)  return CHILD_STATUSES[1];
  return CHILD_STATUSES[0];
}

export const PARTNER_PRIZES = [
  { id: 1, title: "Скидка 20% в Детском Мире", cost: 1000, emoji: "🧸", partner: "Детский Мир", type: "coupon" },
  { id: 2, title: "Билеты в кино на семью", cost: 2000, emoji: "🎬", partner: "Синема Парк", type: "ticket" },
  { id: 3, title: "Промокод на пиццу", cost: 1500, emoji: "🍕", partner: "Додо Пицца", type: "promo" },
  { id: 4, title: "Абонемент в спортзал (1 мес.)", cost: 3000, emoji: "💪", partner: "World Class", type: "gift" },
  { id: 5, title: "Сертификат на книги 500₽", cost: 1000, emoji: "📚", partner: "Лабиринт", type: "certificate" },
  { id: 6, title: "Скидка 15% на витамины", cost: 800, emoji: "💊", partner: "iHerb", type: "promo" },
];