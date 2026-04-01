import { useState } from "react";
import { StreakCard } from "@/components/ui/StreakCard";
import { getParentLevelInfo, getParentLevelTier, PARTNER_PRIZES, type StreakState } from "@/lib/gameTypes";

type Child = { id: number; name: string; stars: number; avatar: string; age: number; inviteCode: string | null; connected: boolean };
type GradeRequest = {
  id: number; childId: number; childName: string;
  subject: string; grade: number; date: string;
  status: string; starsAwarded: number | null;
};

type GradesProps = {
  gradeRequests: GradeRequest[];
  pendingGrades: GradeRequest[];
  onApproveGrade: (id: number) => void;
  onRejectGrade: (id: number) => void;
};

type ChildrenProps = {
  children: Child[];
  onAddChild: (name: string, age: number, avatar: string) => void;
  onRemoveChild: (id: number) => void;
  onRefreshInvite: (id: number) => void;
};

const CHILD_AVATARS = ["👦", "👧", "🧒", "👶", "🐱", "🦊", "🐼", "🦁", "🐸", "🐧", "🦋", "🌟"];

type Reward = { id: number; title: string; cost: number; emoji: string; childId: number | null; quantity: number };

type BonusesProps = {
  streak: StreakState;
  parent_points: number;
  parent_xp: number;
  onClaimStreak: () => void;
  rewards: Reward[];
  children: Child[];
  onAddReward: (title: string, cost: number, emoji: string, childId: number, quantity: number) => void;
  onRemoveReward: (id: number) => void;
};

type ProfileProps = {
  name: string;
  parent_points: number;
  parent_xp: number;
  children: Child[];
  tasks_count: number;
  streak_current: number;
};

export function ParentTabGrades({ gradeRequests, pendingGrades, onApproveGrade, onRejectGrade }: GradesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#1E1B4B]">Оценки детей</h2>
      {pendingGrades.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingGrades.length} новых</span>
          </div>
          {pendingGrades.map(g => (
            <div key={g.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3">
              <div className="flex items-center gap-3 p-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${g.grade >= 4 ? "bg-green-100" : "bg-orange-100"}`}>
                  {g.grade >= 4 ? "😊" : g.grade >= 3 ? "😐" : "😔"}
                </div>
                <div className="flex-1">
                  <p className="font-black text-[#1E1B4B]">{g.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{g.date} · {g.childName}</p>
                </div>
                <div className="text-right">
                  <p className={`font-black text-xl ${g.grade >= 4 ? "text-green-600" : "text-orange-500"}`}>{g.grade}</p>
                  <p className="text-xs text-gray-400">+{g.grade}⭐</p>
                </div>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <button onClick={() => onRejectGrade(g.id)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">✗ Отклонить</button>
                <button onClick={() => onApproveGrade(g.id)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-sm active:scale-95 transition-transform">✓ Подтвердить</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {gradeRequests.filter(g => g.status !== "pending").map(g => (
        <div key={g.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
          <span className="text-xl">{g.grade >= 4 ? "😊" : "😐"}</span>
          <div className="flex-1">
            <p className="font-bold text-[#1E1B4B] text-sm">{g.subject} · {g.grade}</p>
            <p className="text-xs text-gray-400">{g.childName} · {g.date}</p>
          </div>
          {g.status === "approved" ? <span className="text-xs font-bold text-green-500">+{g.starsAwarded}⭐</span> : <span className="text-xs font-bold text-red-400">Отклонено</span>}
        </div>
      ))}
      {gradeRequests.length === 0 && <p className="text-center text-gray-400 py-8">Нет запросов на обмен оценок</p>}
    </div>
  );
}

export function ParentTabChildren({ children, onAddChild, onRemoveChild, onRefreshInvite }: ChildrenProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [avatar, setAvatar] = useState("👧");
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const shareCode = async (id: number, code: string, childName: string) => {
    const text = `Привет! Я жду тебя в приложении СтарКидс 🌟\n\n1️⃣ Открой Telegram → найди @task4kids_bot\n2️⃣ Нажми кнопку «Открыть СтарКидс»\n3️⃣ Введи код: ${code}\n\nИли перейди по ссылке: https://t.me/task4kids_bot?start=${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        // пользователь отменил — ничего не делаем
      }
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddChild(name.trim(), age, avatar);
    setName("");
    setAge(9);
    setAvatar("👧");
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E1B4B]">Мои дети</h2>
        <button onClick={() => setShowForm(v => !v)} className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform">
          {showForm ? "✕ Закрыть" : "+ Добавить"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4">
            <p className="text-white font-black text-base">👶 Новый ребёнок</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Аватар</label>
              <div className="flex gap-2 flex-wrap">
                {CHILD_AVATARS.map(e => (
                  <button key={e} onClick={() => setAvatar(e)}
                    className={`w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all ${avatar === e ? "ring-2 ring-[#6B7BFF] bg-[#6B7BFF]/10 scale-110" : "bg-gray-50"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Имя *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Имя ребёнка"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#6B7BFF]/40" />
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Возраст</label>
              <div className="flex gap-2 flex-wrap">
                {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(a => (
                  <button key={a} onClick={() => setAge(a)}
                    className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${age === a ? "bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] text-white scale-105" : "bg-gray-50 text-gray-600"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleAdd} disabled={!name.trim()} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-sm active:scale-95 transition-transform disabled:opacity-50">
              Добавить ребёнка
            </button>
          </div>
        </div>
      )}

      {children.map(c => {
        const level = Math.floor(c.stars / 10) + 1;
        const pct = (c.stars % 10) / 10 * 100;
        return (
          <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#6B7BFF]/20 to-[#9B6BFF]/20 rounded-2xl flex items-center justify-center text-3xl">{c.avatar}</div>
              <div className="flex-1">
                <p className="font-bold text-[#1E1B4B] text-lg">{c.name}</p>
                <p className="text-sm text-gray-400">{c.age} лет</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-500 font-black text-xl">{c.stars}⭐</p>
                <p className="text-sm font-bold text-[#6B7BFF]">ур. {level}</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>

            {c.connected ? (
              <div className="flex items-center gap-2 mb-3 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                <span className="text-green-500 text-sm">✅</span>
                <p className="text-xs font-bold text-green-600 flex-1">Telegram подключён</p>
                <button onClick={() => onRefreshInvite(c.id)} className="text-[10px] font-bold text-gray-400 underline">сбросить</button>
              </div>
            ) : (
              <div className="mb-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-amber-600">⏳ Ожидает подключения</p>
                  <button onClick={() => onRefreshInvite(c.id)} className="text-[10px] font-bold text-gray-400 underline">новый код</button>
                </div>

                {c.inviteCode ? (
                  <>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 flex-1">Код для ребёнка:</p>
                      <button
                        onClick={() => shareCode(c.id, c.inviteCode!, c.name)}
                        className="font-black text-base tracking-widest text-[#1E1B4B] bg-white border border-amber-200 rounded-lg px-2 py-0.5 active:scale-95 transition-all"
                      >
                        {copiedId === c.id ? <span className="text-green-500 text-xs">✅ Отправлено!</span> : <>{c.inviteCode} 📤</>}
                      </button>
                    </div>
                    <div className="bg-white/70 rounded-xl px-3 py-2 space-y-1">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Инструкция для {c.name}:</p>
                      <p className="text-xs text-gray-600">1️⃣ Открыть Telegram → найти <b>@task4kids_bot</b></p>
                      <p className="text-xs text-gray-600">2️⃣ Нажать кнопку <b>«Открыть СтарКидс»</b></p>
                      <p className="text-xs text-gray-600">3️⃣ Ввести код <b>{c.inviteCode}</b></p>
                    </div>
                  </>
                ) : (
                  <button onClick={() => onRefreshInvite(c.id)} className="text-xs font-bold text-[#6B7BFF]">Создать код →</button>
                )}
              </div>
            )}

            {confirmRemove === c.id ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmRemove(null)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm">Отмена</button>
                <button onClick={() => { onRemoveChild(c.id); setConfirmRemove(null); }} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-sm active:scale-95 transition-transform">Удалить</button>
              </div>
            ) : (
              <button onClick={() => setConfirmRemove(c.id)} className="w-full py-2 rounded-xl bg-gray-50 text-gray-400 font-bold text-xs active:scale-95 transition-transform">
                🗑 Удалить профиль
              </button>
            )}
          </div>
        );
      })}

      {children.length === 0 && !showForm && (
        <div className="text-center py-10">
          <div className="text-5xl mb-3">👨‍👧</div>
          <p className="font-bold text-gray-400">Добавь первого ребёнка</p>
        </div>
      )}
    </div>
  );
}

const REWARD_EMOJIS = ["🎁", "🍕", "🍦", "🎮", "🎬", "📚", "🎨", "🧸", "🎠", "🏆", "🚀", "⚽", "🎯", "🎪", "🛍️", "🍫"];

const REWARD_TEMPLATES = [
  { emoji: "📱", title: "Дополнительное время на планшете/телефоне", cost: 10 },
  { emoji: "🍕", title: "Пицца на ужин", cost: 15 },
  { emoji: "🎮", title: "Лишний час видеоигр", cost: 10 },
  { emoji: "🎬", title: "Поход в кино", cost: 25 },
  { emoji: "🍦", title: "Мороженое на выбор", cost: 5 },
];

export function ParentTabBonuses({ streak, parent_points, parent_xp, onClaimStreak, rewards, children, onAddReward, onRemoveReward }: BonusesProps) {
  const { level } = getParentLevelInfo(parent_xp);
  const tier = getParentLevelTier(level);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [cost, setCost] = useState(10);
  const [emoji, setEmoji] = useState("🎁");
  const [selectedChildId, setSelectedChildId] = useState<number | null>(children.length === 1 ? children[0].id : null);
  const [quantity, setQuantity] = useState(1);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

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
      <StreakCard streak={streak} onClaim={onClaimStreak} />

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

type PartnersProps = {
  parent_points: number;
  parent_xp: number;
};

export function ParentTabPartners({ parent_points, parent_xp }: PartnersProps) {
  const { level } = getParentLevelInfo(parent_xp);
  const tier = getParentLevelTier(level);
  const [exchanged, setExchanged] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Шапка */}
      <div className="bg-gradient-to-br from-[#FF6B35] via-[#FF3D9A] to-[#9B6BFF] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
        <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1 relative">Магазин призов</p>
        <h2 className="text-2xl font-black relative">🎁 Партнёры</h2>
        <p className="text-white/80 text-xs mt-1 relative">Обменивайте баллы на реальные призы от наших партнёров</p>
        <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center justify-between relative">
          <div>
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">Ваш баланс</p>
            <p className="text-2xl font-black">{parent_points.toLocaleString()} <span className="text-base font-bold">баллов</span></p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wide">Статус</p>
            <p className="text-sm font-black">{tier.emoji} {tier.badge}</p>
          </div>
        </div>
      </div>

      {/* Список призов */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-base font-bold text-[#1E1B4B]">Доступные призы</h3>
          <span className="bg-gradient-to-r from-[#FF6B35] to-[#FF3D9A] text-white text-[10px] font-black px-2 py-0.5 rounded-full">{PARTNER_PRIZES.length} предложений</span>
        </div>
        {PARTNER_PRIZES.map(prize => {
          const canBuy = parent_points >= prize.cost;
          const isExchanged = exchanged === prize.id;
          const progress = Math.min((parent_points / prize.cost) * 100, 100);
          return (
            <div key={prize.id} className={`bg-white rounded-2xl shadow-sm border mb-3 overflow-hidden transition-all ${canBuy ? "border-[#FF6B35]/30 shadow-[#FF6B35]/10 shadow-md" : "border-gray-100"}`}>
              {canBuy && (
                <div className="h-1 bg-gradient-to-r from-[#FF6B35] to-[#FF3D9A]" />
              )}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${canBuy ? "bg-gradient-to-br from-[#FF6B35]/10 to-[#FF3D9A]/10" : "bg-gray-50"}`}>
                    {prize.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#1E1B4B] text-sm">{prize.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">от <span className="font-semibold text-gray-500">{prize.partner}</span></p>
                    {!canBuy && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>{parent_points.toLocaleString()} из {prize.cost.toLocaleString()} б.</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF3D9A] rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🏅</span>
                    <p className="text-sm font-black text-[#FF6B35]">{prize.cost.toLocaleString()} баллов</p>
                  </div>
                  {isExchanged ? (
                    <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-xl">
                      <span className="text-sm">✅</span>
                      <span className="text-xs font-black text-green-600">Заявка отправлена!</span>
                    </div>
                  ) : (
                    <button
                      disabled={!canBuy}
                      onClick={() => canBuy && setExchanged(prize.id)}
                      className={`text-sm font-black px-4 py-2 rounded-xl transition-all active:scale-95
                        ${canBuy
                          ? "bg-gradient-to-r from-[#FF6B35] to-[#FF3D9A] text-white shadow-md shadow-[#FF6B35]/30"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}>
                      {canBuy ? "Обменять 🎉" : "Не хватает"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Инфо-блок */}
      <div className="bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 border border-[#6B7BFF]/20 rounded-2xl px-4 py-3 flex gap-3 items-start">
        <span className="text-xl">💡</span>
        <div>
          <p className="text-xs font-bold text-[#6B7BFF] uppercase tracking-wide mb-0.5">Как получить больше баллов?</p>
          <p className="text-sm text-gray-600">Создавайте задачи, подтверждайте оценки и поддерживайте ежедневный стрик — за каждое действие начисляются баллы!</p>
        </div>
      </div>
    </div>
  );
}

export function ParentTabProfile({ name, parent_points, parent_xp, children, tasks_count, streak_current }: ProfileProps) {
  const { level } = getParentLevelInfo(parent_xp);
  const tier = getParentLevelTier(level);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-6 text-center text-white shadow-lg">
        <div className="text-6xl mb-2">👨</div>
        <h2 className="text-2xl font-black">{name}</h2>
        <p className="opacity-80 font-bold">{tier.badge}</p>
        <div className="mt-3 bg-white/20 rounded-2xl px-4 py-2 inline-block">
          <p className="text-sm font-black">{parent_points.toLocaleString()} баллов</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Детей", value: children.length, emoji: "👨‍👧‍👦" },
          { label: "Задач создано", value: tasks_count, emoji: "📋" },
          { label: "Уровень", value: level, emoji: tier.emoji },
          { label: "Стрик", value: `${streak_current}🔥`, emoji: "📅" },
        ].map(s => (
          <div key={s.label} className="bg-white/90 rounded-3xl p-4 text-center shadow-sm">
            <div className="text-3xl mb-1">{s.emoji}</div>
            <div className="text-2xl font-black text-[#1E1B4B]">{s.value}</div>
            <div className="text-xs font-bold text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}