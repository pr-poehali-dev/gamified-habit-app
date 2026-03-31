export const API = "https://functions.poehali.dev/3a2e1162-786c-43ae-a6b7-78b24771e462";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: { user?: { id: number; first_name: string } };
        ready: () => void;
        expand: () => void;
        close: () => void;
        BackButton: { show: () => void; hide: () => void; onClick: (fn: () => void) => void };
        MainButton: { show: () => void; hide: () => void; setText: (t: string) => void; onClick: (fn: () => void) => void; showProgress: () => void; hideProgress: () => void };
        HapticFeedback: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void };
        colorScheme: string;
      };
    };
  }
}

export const tg = () => window.Telegram?.WebApp;

export type Task = {
  id: number;
  emoji: string;
  title: string;
  stars: number;
  original_stars: number;
  late_stars: number | null;
  status: "pending" | "done" | "approved";
  deadline: string | null;
  is_overdue: boolean;
  can_complete: boolean;
  created_at: string;
  completed_at: string | null;
  child_name?: string;
  child_id?: number;
};

export type ShopItem = { id: number; emoji: string; title: string; cost: number; can_buy: boolean };
export type ChildStat = { name: string; stars: number; done: number; total: number; overdue: number };

export type User =
  | { role: "child"; id: number; name: string; stars: number; parent_id: number; telegram_id: number }
  | { role: "parent"; id: number; name: string; telegram_id: number; children: { id: number; name: string; stars: number }[] }
  | { role: "unknown"; telegram_id: number };

export type Tab = "tasks" | "shop" | "stats";

export function formatDeadline(iso: string | null): { label: string; color: string } | null {
  if (!iso) return null;
  const now = Date.now();
  const dl = new Date(iso).getTime();
  const diff = dl - now;
  if (diff < 0) {
    const h = Math.floor(Math.abs(diff) / 3600000);
    return { label: `просрочено ${h > 0 ? h + "ч" : ""} назад`, color: "text-red-500" };
  }
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h <= 2) return { label: `${h}ч осталось!`, color: "text-orange-500" };
  if (d >= 1) return { label: `${d}д ${h % 24}ч`, color: "text-yellow-600" };
  return { label: `${h}ч`, color: "text-yellow-600" };
}

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

export function getNextTier(level: number) {
  return LEVEL_TIERS.find(t => t.from > level) ?? null;
}
