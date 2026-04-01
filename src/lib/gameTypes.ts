// ─── Child level system ───────────────────────────────────────────────────────

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
  return [...LEVEL_TIERS].reverse().find(t => level >= t.from)?.emoji ?? "⭐";
}

export function getLevelTier(level: number) {
  return [...LEVEL_TIERS].reverse().find(t => level >= t.from) ?? LEVEL_TIERS[0];
}

export const GRADE_STARS: Record<number, number> = { 5: 5, 4: 4, 3: 3, 2: 2 };

export type GradeValue = 2 | 3 | 4 | 5;

export type AchievementId =
  | "first_task" | "tasks_5" | "tasks_10" | "tasks_25"
  | "stars_10" | "stars_50" | "stars_100"
  | "level_3" | "level_5" | "level_10"
  | "spend_10" | "spend_30"
  | "reward_1" | "reward_3"
  | "streak_3" | "streak_7";

export function getSubjectsByAge(age: number): string[] {
  if (age <= 6)  return ["Чтение", "Математика", "Рисование", "Лепка", "Музыка", "Физкультура"];
  if (age <= 9)  return ["Математика", "Русский", "Чтение", "Окр. мир", "Рисование", "Физкультура", "Музыка", "Английский"];
  if (age <= 12) return ["Математика", "Русский", "Литература", "Английский", "История", "Природа", "Физкультура", "Музыка", "Рисование"];
  return ["Алгебра", "Геометрия", "Русский", "Литература", "Английский", "История", "Биология", "Физика", "Химия", "Физкультура", "ИЗО"];
}

// ─── Parent level system ──────────────────────────────────────────────────────

const PARENT_LEVEL_TIERS = [
  { from: 1,  badge: "🌱 Начинающий",   emoji: "🌱" },
  { from: 3,  badge: "⭐ Активный",      emoji: "⭐" },
  { from: 5,  badge: "🏅 Опытный",       emoji: "🏅" },
  { from: 8,  badge: "🎖️ Продвинутый",  emoji: "🎖️" },
  { from: 10, badge: "🏆 Мастер",        emoji: "🏆" },
];

export function getParentLevelInfo(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const xpPct = (xpInLevel / 100) * 100;
  return { level, xpInLevel, xpPct };
}

export function getParentLevelTier(level: number) {
  return [...PARENT_LEVEL_TIERS].reverse().find(t => level >= t.from) ?? PARENT_LEVEL_TIERS[0];
}

export function getParentTip(level: number): string {
  const tips: Record<number, string> = {
    1: "Добавь первое задание для ребёнка — это займёт меньше минуты!",
    2: "Попробуй требовать фото-отчёт для важных заданий",
    3: "Регулярно проверяй оценки — дети ждут подтверждения!",
    4: "Создай магазин наград чтобы мотивировать ребёнка",
    5: "Используй стрики для поддержания ежедневных привычек",
  };
  return tips[Math.min(level, 5)] ?? "Продолжай в том же духе — ты отличный родитель!";
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export type StreakState = {
  current: number;
  lastActivityDate: string;
  claimedToday: boolean;
  longestStreak: number;
};

// ─── Partner prizes ───────────────────────────────────────────────────────────

export const PARTNER_PRIZES = [
  { id: 1, title: "Пицца на семью",        partner: "Додо Пицца",   cost: 5000,  emoji: "🍕" },
  { id: 2, title: "Книга по выбору",        partner: "Читай-город",  cost: 2000,  emoji: "📚" },
  { id: 3, title: "Поход в кино",           partner: "Синема Парк",  cost: 3000,  emoji: "🎬" },
  { id: 4, title: "Настольная игра",        partner: "Мосигра",      cost: 4000,  emoji: "🎲" },
  { id: 5, title: "Урок рисования",         partner: "Skillbox Kids", cost: 6000, emoji: "🎨" },
];
