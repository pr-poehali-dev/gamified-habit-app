import { useState } from "react";
import { XpBar } from "@/components/ui/XpBar";
import { AchievementGrid } from "@/components/ui/AchievementBadge";
import { getLevelInfo, getLevelTier, getLevelEmoji, LEVEL_TIERS, STARS_PER_LEVEL, getSubjectsByAge, GRADE_STARS, type GradeValue, type AchievementId } from "@/lib/gameTypes";

type GradeReq = {
  id: number; subject: string; grade: number; date: string;
  status: string; starsAwarded: number | null; createdAt: string;
};

// ─── Stars tab ────────────────────────────────────────────────────────────────

type StarsProps = { stars: number; totalStarsEarned: number; level: number; levelEmoji: string };

export function ChildTabStars({ stars, totalStarsEarned, level, levelEmoji }: StarsProps) {
  // XP и уровень считаются от всех заработанных звёзд (не списываются при покупках)
  const earned = totalStarsEarned ?? stars;
  return (
    <>
      <h2 className="text-lg font-black text-[#2D1B69]">Мои звёзды</h2>
      <div className="bg-gradient-to-br from-[#FFD700] to-[#FF9500] rounded-3xl p-6 text-center shadow-lg">
        <div className="text-7xl mb-2">⭐</div>
        <div className="text-5xl font-black text-white">{stars}</div>
        <div className="text-white/80 font-bold mt-1">звёзд для обмена</div>
      </div>
      <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-3xl p-5 text-center shadow-lg">
        <div className="text-5xl mb-1">{levelEmoji}</div>
        <div className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">{getLevelTier(level).title} · Уровень {level}</div>
        <div className="mt-3">
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${getLevelInfo(earned).xpPct}%` }} />
          </div>
          <p className="text-white/70 text-xs mt-1.5">
            {getLevelInfo(earned).xpInLevel}/10 XP · до ур. {level + 1} ещё {STARS_PER_LEVEL - getLevelInfo(earned).xpInLevel}⭐
          </p>
        </div>
      </div>
      <div className="bg-white/90 rounded-3xl p-4 shadow-sm">
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
                </div>
                {i < LEVEL_TIERS.length - 1 && (
                  <div className={`w-5 h-px mx-1 mb-4 ${level >= LEVEL_TIERS[i + 1].from ? "bg-yellow-400" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Grades tab ───────────────────────────────────────────────────────────────

type GradesProps = {
  level: number;
  age: number;
  gradeRequests: GradeReq[];
  pendingGrades: GradeReq[];
  onSubmitGrade: (subject: string, grade: GradeValue, date: string) => void;
};

export function ChildTabGrades({ level, age, gradeRequests, pendingGrades, onSubmitGrade }: GradesProps) {
  const subjects = getSubjectsByAge(age || 9);
  const [gradeSubject, setGradeSubject] = useState(subjects[0]);
  const [gradeValue, setGradeValue] = useState<GradeValue>(5);
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().slice(0, 10));
  const [gradeSent, setGradeSent] = useState(false);

  const handleSubmit = async () => {
    if (!gradeSubject) return;
    setGradeSent(true);
    onSubmitGrade(gradeSubject, gradeValue, gradeDate);
    setTimeout(() => setGradeSent(false), 2000);
  };

  return (
    <>
      <h2 className="text-lg font-black text-[#2D1B69]">Оценки → Звёзды</h2>

      {level < 2 && (
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-2 border-dashed border-gray-300 rounded-3xl p-5 text-center">
          <div className="text-4xl mb-2">🔒</div>
          <p className="font-black text-gray-500 text-base">Доступно с уровня 2</p>
          <p className="text-sm text-gray-400 mt-1">Ты на уровне {level}. Выполняй задания!</p>
        </div>
      )}

      <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden ${level < 2 ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4">
          <p className="text-white font-black text-base">📝 Отправить оценку</p>
          <p className="text-white/70 text-xs mt-0.5">Курс: 1 балл = 1 звезда ⭐</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Предмет ({age} лет)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {subjects.map(s => (
                <button key={s} onClick={() => setGradeSubject(s)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all leading-tight ${gradeSubject === s ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm" : "bg-gray-50 text-gray-600"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Оценка</label>
            <div className="grid grid-cols-4 gap-2">
              {([5, 4, 3, 2] as GradeValue[]).map(g => (
                <button key={g} onClick={() => setGradeValue(g)}
                  className={`py-3 rounded-2xl flex flex-col items-center gap-1 transition-all border-2 ${gradeValue === g ? (g >= 4 ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-400 text-white shadow-md scale-105" : "bg-gradient-to-br from-orange-400 to-red-500 border-orange-400 text-white shadow-md scale-105") : "bg-gray-50 border-gray-100 text-gray-600"}`}>
                  <span className="text-lg">{g >= 4 ? "😊" : g >= 3 ? "😐" : "😔"}</span>
                  <span className="text-base font-black">{g}</span>
                  <span className="text-[9px]">{GRADE_STARS[g]}⭐</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Дата</label>
            <input type="date" value={gradeDate} max={new Date().toISOString().slice(0, 10)} onChange={e => setGradeDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold" />
          </div>
          <button onClick={handleSubmit} disabled={gradeSent}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${gradeSent ? "bg-green-500 text-white" : "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white shadow-md"}`}>
            {gradeSent ? "✅ Запрос отправлен!" : "📤 Отправить родителю"}
          </button>
        </div>
      </div>

      {pendingGrades.length > 0 && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Ожидают подтверждения</p>
          {pendingGrades.map(g => (
            <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex items-center gap-3 mb-2">
              <span className="text-2xl">{g.grade >= 4 ? "😊" : "😐"}</span>
              <div className="flex-1">
                <p className="font-bold text-[#1E1B4B] text-sm">{g.subject}</p>
                <p className="text-xs text-gray-400">{g.date}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-amber-500 text-sm">{g.grade} балл</p>
                <p className="text-xs text-amber-400">⏳ ждём</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {gradeRequests.filter(g => g.status !== "pending").length > 0 && (
        <div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">История</p>
          {gradeRequests.filter(g => g.status !== "pending").map(g => (
            <div key={g.id} className={`bg-white rounded-2xl p-3 shadow-sm border flex items-center gap-3 mb-2 ${g.status === "approved" ? "border-green-100" : "border-red-100"}`}>
              <span className="text-xl">{g.grade >= 4 ? "😊" : "😐"}</span>
              <div className="flex-1">
                <p className="font-bold text-[#1E1B4B] text-sm">{g.subject}</p>
                <p className="text-xs text-gray-400">{g.date}</p>
              </div>
              {g.status === "approved"
                ? <span className="text-xs font-bold text-green-500">+{g.starsAwarded}⭐</span>
                : <span className="text-xs font-bold text-red-400">Отклонено</span>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Achievements tab ─────────────────────────────────────────────────────────

type AchievementsProps = { achievements: AchievementId[] };

export function ChildTabAchievements({ achievements }: AchievementsProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-[#2D1B69]">Мои ачивки</h2>
        <span className="text-sm font-bold text-gray-400">{achievements.length}/16</span>
      </div>
      <AchievementGrid unlockedIds={achievements} />
    </>
  );
}

// ─── Shop tab ─────────────────────────────────────────────────────────────────

type Reward = { id: number; title: string; cost: number; emoji: string; childId: number | null; quantity: number };

type RewardPurchase = {
  id: number;
  rewardId: number;
  title: string;
  emoji: string;
  cost: number;
  status: string;
  purchasedAt: string;
};

type Wish = { id: number; title: string; emoji: string; status: string; createdAt: string };

type ShopProps = {
  stars: number;
  rewards: Reward[];
  rewardPurchases: RewardPurchase[];
  wishes: Wish[];
  onBuy: (rewardId: number) => void;
  onAddWish: (title: string, emoji: string) => void;
  onDeleteWish: (wishId: number) => void;
};

const WISH_TEMPLATES = [
  { emoji: "🎮", title: "Новая игра" },
  { emoji: "🍕", title: "Пицца на ужин" },
  { emoji: "🎬", title: "Поход в кино" },
  { emoji: "🛝", title: "Поход в парк развлечений" },
  { emoji: "🧸", title: "Новая игрушка" },
  { emoji: "📱", title: "Больше времени с телефоном" },
];

const WISH_EMOJIS = ["🎁", "🎮", "🍕", "🎬", "🛝", "🧸", "📱", "🍦", "⚽", "🎨", "🎠", "🚀"];

export function ChildTabShop({ stars, rewards, rewardPurchases, wishes, onBuy, onAddWish, onDeleteWish }: ShopProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showWishForm, setShowWishForm] = useState(false);
  const [wishTitle, setWishTitle] = useState("");
  const [wishEmoji, setWishEmoji] = useState("🎁");

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <h2 className="text-lg font-black text-[#2D1B69]">Магазин наград</h2>
      <div className="bg-gradient-to-br from-[#FFD700] to-[#FF9500] rounded-3xl p-4 flex items-center gap-3 shadow-lg">
        <span className="text-4xl">⭐</span>
        <div>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">Твой баланс</p>
          <p className="text-3xl font-black text-white">{stars} <span className="text-xl font-bold">звёзд</span></p>
        </div>
      </div>
      {rewards.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">🛍️</div>
          <p className="font-bold text-gray-400 text-base">Магазин пока пуст</p>
          <p className="text-sm text-gray-300 mt-1">Попроси родителя добавить награды!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map(reward => {
            const canBuy = stars >= reward.cost && reward.quantity > 0;
            return (
              <div key={reward.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <span className="text-4xl">{reward.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#2D1B69] text-sm">{reward.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-xs text-amber-500 font-black">{reward.cost} ⭐</p>
                    {reward.quantity > 0 ? (
                      <span className="text-xs bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded-lg">доступно: {reward.quantity} шт.</span>
                    ) : (
                      <span className="text-xs bg-red-50 text-red-400 font-bold px-1.5 py-0.5 rounded-lg">закончилась</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onBuy(reward.id)}
                  disabled={!canBuy}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shrink-0 ${
                    canBuy
                      ? "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {reward.quantity <= 0 ? "Нет" : canBuy ? "Купить" : "Мало ⭐"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Запросить награду */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-black text-[#2D1B69]">💫 Хочу награду</p>
          <button onClick={() => setShowWishForm(v => !v)} className="bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
            {showWishForm ? "✕" : "+ Попросить"}
          </button>
        </div>

        {showWishForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 space-y-3 mb-3">
            <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Быстрый выбор</p>
            <div className="flex flex-wrap gap-2">
              {WISH_TEMPLATES.map(tpl => (
                <button key={tpl.title} onClick={() => { setWishTitle(tpl.title); setWishEmoji(tpl.emoji); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${wishTitle === tpl.title ? "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white" : "bg-gray-50 text-gray-600"}`}>
                  <span>{tpl.emoji}</span>
                  <span>{tpl.title}</span>
                </button>
              ))}
            </div>
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">Иконка</p>
              <div className="flex gap-2 flex-wrap">
                {WISH_EMOJIS.map(e => (
                  <button key={e} onClick={() => setWishEmoji(e)}
                    className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${wishEmoji === e ? "ring-2 ring-pink-400 bg-pink-50 scale-110" : "bg-gray-50"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">Или напиши своё</p>
              <input type="text" value={wishTitle} onChange={e => setWishTitle(e.target.value)} placeholder="Что ты хочешь?"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-pink-300" />
            </div>
            <button
              onClick={() => {
                if (!wishTitle.trim()) return;
                onAddWish(wishTitle.trim(), wishEmoji);
                setWishTitle("");
                setWishEmoji("🎁");
                setShowWishForm(false);
              }}
              disabled={!wishTitle.trim()}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white font-black text-sm active:scale-95 transition-transform disabled:opacity-50">
              Отправить родителю
            </button>
          </div>
        )}

        {wishes.length > 0 && (
          <div className="space-y-2">
            {wishes.map(w => (
              <div key={w.id} className="bg-white rounded-2xl p-3 shadow-sm border border-pink-100 flex items-center gap-3">
                <span className="text-2xl">{w.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#2D1B69] text-sm truncate">{w.title}</p>
                  <p className="text-xs text-pink-400 font-bold mt-0.5">⏳ Отправлено родителю</p>
                </div>
                <button onClick={() => onDeleteWish(w.id)} className="text-gray-300 text-sm active:scale-90 transition-transform">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* История покупок из PostgreSQL */}
      {rewardPurchases.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center justify-between w-full py-2 px-1"
          >
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide">
              🧾 История покупок ({rewardPurchases.length})
            </p>
            <span className="text-xs text-gray-400 font-bold">{showHistory ? "▲ Скрыть" : "▼ Показать"}</span>
          </button>
          {showHistory && (
            <div className="space-y-2 mt-1">
              {rewardPurchases.map(p => (
                <div key={p.id} className={`bg-white rounded-2xl p-3 shadow-sm border flex items-center gap-3 ${
                  p.status === "fulfilled" ? "border-green-100" : "border-amber-100"
                }`}>
                  <span className="text-2xl">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#2D1B69] text-sm truncate">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.purchasedAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-amber-500">−{p.cost} ⭐</p>
                    <p className={`text-xs font-bold mt-0.5 ${
                      p.status === "fulfilled" ? "text-green-500" : "text-amber-500"
                    }`}>
                      {p.status === "fulfilled" ? "✅ Выдано" : "⏳ Ожидает"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

type ProfileProps = {
  name: string; avatar: string; age: number;
  stars: number; totalStarsEarned: number; level: number; levelEmoji: string;
  approvedTasksCount: number; achievementsCount: number;
};

export function ChildTabProfile({ name, avatar, age, stars, totalStarsEarned, level, levelEmoji, approvedTasksCount, achievementsCount }: ProfileProps) {
  const earned = totalStarsEarned ?? stars;
  return (
    <>
      <div className="bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B] rounded-3xl p-6 text-center text-white shadow-lg">
        <div className="text-6xl mb-2">{avatar}</div>
        <h2 className="text-2xl font-black">{name}</h2>
        <p className="opacity-80 font-bold">{age} лет</p>
        <div className="mt-3 flex items-center justify-center gap-2 bg-white/20 rounded-2xl px-4 py-2">
          <span className="text-xl">{levelEmoji}</span>
          <span className="font-black text-lg">Уровень {level}</span>
        </div>
      </div>
      <div className="bg-white/80 rounded-2xl px-4 py-3 shadow-sm">
        {/* XP считается от всех заработанных звёзд, не от баланса */}
        <XpBar stars={earned} showTierHint />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Звёзд", value: stars, emoji: "⭐" },
          { label: "Уровень", value: level, emoji: levelEmoji },
          { label: "Задач выполнено", value: approvedTasksCount, emoji: "✅" },
          { label: "Ачивок", value: achievementsCount, emoji: "🏅" },
        ].map(s => (
          <div key={s.label} className="bg-white/90 rounded-3xl p-4 text-center shadow-sm">
            <div className="text-3xl mb-1">{s.emoji}</div>
            <div className="text-2xl font-black text-[#2D1B69]">{s.value}</div>
            <div className="text-xs font-bold text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}