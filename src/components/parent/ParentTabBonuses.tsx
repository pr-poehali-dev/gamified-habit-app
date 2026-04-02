import { useState } from "react";
import { StreakCard } from "@/components/ui/StreakCard";
import { getParentLevelInfo, getParentLevelTier, type StreakState } from "@/lib/gameTypes";

type Child = { id: number; name: string; stars: number; avatar: string; age: number; inviteCode: string | null; connected: boolean };
type Reward = { id: number; title: string; cost: number; emoji: string; childId: number | null; quantity: number };

type StreakReward = {
  todayXp: number;
  todayPoints: number;
  nextXp: number;
  nextPoints: number;
  claimed: boolean;
};

type RewardWish = { id: number; childId: number; childName: string; title: string; emoji: string; createdAt: string };

type BonusesProps = {
  streak: StreakState;
  streakReward?: StreakReward;
  parent_points: number;
  parent_xp: number;
  rewards: Reward[];
  children: Child[];
  onAddReward: (title: string, cost: number, emoji: string, childId: number, quantity: number) => void;
  onRemoveReward: (id: number) => void;
  rewardWishes?: RewardWish[];
  onDismissWish?: (wishId: number) => void;
};

const REWARD_EMOJIS = ["🎁", "🍕", "🍦", "🎮", "🎬", "📚", "🎨", "🧸", "🎠", "🏆", "🚀", "⚽", "🎯", "🎪", "🛍️", "🍫"];

const REWARD_TEMPLATES = [
  { emoji: "📱", title: "Дополнительное время на планшете/телефоне", cost: 10 },
  { emoji: "🍕", title: "Пицца на ужин", cost: 15 },
  { emoji: "🎮", title: "Лишний час видеоигр", cost: 10 },
  { emoji: "🎬", title: "Поход в кино", cost: 25 },
  { emoji: "🍦", title: "Мороженое на выбор", cost: 5 },
];

export function ParentTabBonuses({ streak, streakReward, parent_points, parent_xp, rewards, children, onAddReward, onRemoveReward, rewardWishes, onDismissWish }: BonusesProps) {
  const { level } = getParentLevelInfo(parent_xp);
  const tier = getParentLevelTier(level);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(10);
  const [emoji, setEmoji] = useState("🎁");
  const [selectedChildId, setSelectedChildId] = useState<number | null>(children.length === 1 ? children[0].id : null);
  const [quantity, setQuantity] = useState(1);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [wishAddId, setWishAddId] = useState<number | null>(null);
  const [wishCost, setWishCost] = useState(10);

  const handleAdd = () => {
    if (!title.trim() || cost < 1 || !selectedChildId || quantity < 1) return;
    onAddReward(title.trim(), cost, emoji, selectedChildId, quantity);
    setTitle("");
    setCost(10);
    setEmoji("🎁");
    setQuantity(1);
    setSelectedChildId(children.length === 1 ? children[0].id : null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <StreakCard streak={streak} reward={streakReward} />

      {/* Желаемые награды от детей */}
      {rewardWishes && rewardWishes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-bold text-[#1E1B4B]">💫 Желаемые награды</h3>
            <span className="bg-pink-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{rewardWishes.length}</span>
          </div>
          <div className="space-y-2">
            {rewardWishes.map(w => (
              <div key={w.id} className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{w.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1E1B4B] text-sm">{w.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{w.childName} хочет эту награду</p>
                  </div>
                  <button
                    onClick={() => onDismissWish?.(w.id)}
                    className="text-gray-300 text-sm active:scale-90 transition-transform shrink-0"
                  >✕</button>
                </div>
                {wishAddId === w.id ? (
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Стоимость в звёздах</p>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20, 25].map(s => (
                        <button key={s} onClick={() => setWishCost(s)}
                          className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${wishCost === s ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white scale-105" : "bg-gray-50 text-gray-600"}`}>
                          {s}⭐
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setWishAddId(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">Отмена</button>
                      <button onClick={() => {
                        onAddReward(w.title, wishCost, w.emoji, w.childId, 1);
                        onDismissWish?.(w.id);
                        setWishAddId(null);
                        setWishCost(10);
                      }} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-bold text-sm active:scale-95 transition-transform">
                        Добавить за {wishCost}⭐
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 pb-4">
                    <button onClick={() => { setWishAddId(w.id); setWishCost(10); }}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 border border-[#6B7BFF]/20 text-[#6B7BFF] font-bold text-xs active:scale-95 transition-transform">
                      🛍️ Добавить в магазин
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Магазин наград для детей */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-[#1E1B4B]">🛍️ Магазин наград для детей</h3>
          <button onClick={() => setShowForm(v => !v)} className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-transform">
            {showForm ? "✕" : "+ Добавить"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-3">
            <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4">
              <p className="text-white font-black text-base">🎁 Новая награда</p>
              <p className="text-white/70 text-xs mt-0.5">Ребёнок сможет купить её за звёзды</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Быстрый выбор</label>
                <div className="flex flex-col gap-2">
                  {REWARD_TEMPLATES.map(t => (
                    <button
                      key={t.title}
                      onClick={() => { setEmoji(t.emoji); setTitle(t.title); setCost(t.cost); }}
                      className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-[#6B7BFF]/10 border border-gray-100 hover:border-[#6B7BFF]/30 transition-all active:scale-95"
                    >
                      <span className="text-xl">{t.emoji}</span>
                      <span className="flex-1 text-sm font-semibold text-gray-700 leading-tight">{t.title}</span>
                      <span className="text-xs font-black text-amber-500 shrink-0">{t.cost} ⭐</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Эмодзи</label>
                <div className="flex gap-2 flex-wrap">
                  {REWARD_EMOJIS.map(e => (
                    <button key={e} onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${emoji === e ? "ring-2 ring-[#6B7BFF] bg-[#6B7BFF]/10 scale-110" : "bg-gray-50"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Название *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Поход в кино"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#6B7BFF]/40" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Стоимость (звёзды) *</label>
                <input type="number" min={1} value={cost} onChange={e => setCost(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#6B7BFF]/40" />
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Для кого *</label>
                {children.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Сначала добавь ребёнка во вкладке «Дети»</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {children.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedChildId(c.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${selectedChildId === c.id ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm scale-105" : "bg-gray-50 text-gray-600 border border-gray-200"}`}
                      >
                        <span>{c.avatar}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Количество (шт.) *</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 font-black text-lg active:scale-95 transition-all flex items-center justify-center">−</button>
                  <span className="text-2xl font-black text-[#1E1B4B] w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 font-black text-lg active:scale-95 transition-all flex items-center justify-center">+</button>
                  <span className="text-xs text-gray-400 font-semibold">шт. доступно ребёнку</span>
                </div>
              </div>
              <button onClick={handleAdd} disabled={!title.trim() || cost < 1 || !selectedChildId || quantity < 1}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-sm active:scale-95 transition-transform disabled:opacity-50">
                Добавить награду
              </button>
            </div>
          </div>
        )}

        {rewards.length === 0 && !showForm && (
          <div className="text-center py-8 bg-white/60 rounded-2xl">
            <div className="text-4xl mb-2">🎁</div>
            <p className="font-bold text-gray-400">Нет наград в магазине</p>
            <p className="text-xs text-gray-300 mt-1">Добавь награды, чтобы мотивировать ребёнка!</p>
          </div>
        )}

        {rewards.map(reward => {
          const rewardChild = children.find(c => c.id === reward.childId);
          return (
            <div key={reward.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-2 flex items-center gap-3">
              <span className="text-3xl">{reward.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1E1B4B] text-sm truncate">{reward.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs font-black text-amber-500">{reward.cost} ⭐</p>
                  {rewardChild && (
                    <span className="text-xs bg-purple-50 text-purple-600 font-bold px-1.5 py-0.5 rounded-lg">{rewardChild.avatar} {rewardChild.name}</span>
                  )}
                  {reward.quantity > 0 ? (
                    <span className="text-xs bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded-lg">осталось: {reward.quantity} шт.</span>
                  ) : (
                    <span className="text-xs bg-red-50 text-red-400 font-bold px-1.5 py-0.5 rounded-lg">закончилась</span>
                  )}
                </div>
              </div>
              {confirmRemove === reward.id ? (
                <div className="flex gap-1">
                  <button onClick={() => setConfirmRemove(null)} className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 text-gray-500 font-bold">Нет</button>
                  <button onClick={() => { onRemoveReward(reward.id); setConfirmRemove(null); }} className="text-xs px-2 py-1.5 rounded-lg bg-red-500 text-white font-bold">Да</button>
                </div>
              ) : (
                <button onClick={() => setConfirmRemove(reward.id)} className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 text-gray-400 font-bold hover:bg-red-50 hover:text-red-400 transition-colors">🗑</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Баллы родителя */}
      <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-5 text-white shadow-lg">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Ваш баланс</p>
        <p className="text-4xl font-black">{parent_points.toLocaleString()} <span className="text-2xl font-bold">баллов</span></p>
        <p className="text-white/70 text-xs mt-2">+1 000 баллов за каждый новый уровень</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg">{tier.emoji}</span>
          <span className="text-sm font-bold">{tier.badge}</span>
        </div>
      </div>

      {/* Промо-баннер магазина партнёров */}
      <div className="bg-gradient-to-r from-[#FF6B35] to-[#FF3D9A] rounded-3xl p-4 text-white shadow-lg flex items-center gap-3">
        <span className="text-4xl">🎁</span>
        <div className="flex-1">
          <p className="font-black text-sm">Магазин призов партнёров</p>
          <p className="text-white/80 text-xs mt-0.5">Тратьте баллы на реальные призы!</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-white/70">вкладка</p>
          <p className="text-lg font-black">Призы 🎁</p>
        </div>
      </div>
    </div>
  );
}