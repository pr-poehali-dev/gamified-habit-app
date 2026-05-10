import { useState } from "react";

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
  const [showWishForm, setShowWishForm] = useState(rewards.length < 5);
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
