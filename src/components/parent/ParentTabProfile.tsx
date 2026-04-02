import { useState } from "react";
import { getParentLevelInfo, getParentLevelTier } from "@/lib/gameTypes";
import { ChildAnalyticsCard, type ChildAnalytics } from "./ChildAnalyticsCard";
import { apiCall } from "@/components/miniapp/useApi";
import { PremiumBadge } from "@/components/ui/PremiumBadge";

type Child = { id: number; name: string; stars: number; avatar: string; age: number; inviteCode: string | null; connected: boolean };

type ProfileProps = {
  name: string;
  parent_points: number;
  parent_xp: number;
  children: Child[];
  tasks_count: number;
  streak_current: number;
  onAddChild: (name: string, age: number, avatar: string) => void;
  onRemoveChild: (id: number) => void;
  onRefreshInvite: (id: number) => void;
  isPremium?: boolean;
};

const CHILD_AVATARS = ["👦", "👧", "🧒", "👶", "🐱", "🦊", "🐼", "🦁", "🐸", "🐧", "🦋", "🌟"];

export function ParentTabProfile({ name, parent_points, parent_xp, children, tasks_count, streak_current, onAddChild, onRemoveChild, onRefreshInvite, isPremium }: ProfileProps) {
  const { level } = getParentLevelInfo(parent_xp);
  const tier = getParentLevelTier(level);

  const [showForm, setShowForm] = useState(false);
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState(9);
  const [avatar, setAvatar] = useState("👧");
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Аналитика
  const [analyticsData, setAnalyticsData] = useState<ChildAnalytics[] | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const loadAnalytics = async () => {
    if (analyticsData) {
      setShowAnalytics(v => !v);
      return;
    }
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await apiCall("parent/analytics", {});
      if (res.ok && res.analytics) {
        setAnalyticsData(res.analytics as ChildAnalytics[]);
        setShowAnalytics(true);
      } else {
        setAnalyticsError("Не удалось загрузить аналитику");
      }
    } catch {
      setAnalyticsError("Ошибка загрузки");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await apiCall("parent/analytics", {});
      if (res.ok && res.analytics) {
        setAnalyticsData(res.analytics as ChildAnalytics[]);
      } else {
        setAnalyticsError("Не удалось обновить");
      }
    } catch {
      setAnalyticsError("Ошибка обновления");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const shareCode = async (id: number, code: string, cName: string) => {
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
    if (!childName.trim()) return;
    onAddChild(childName.trim(), age, avatar);
    setChildName("");
    setAge(9);
    setAvatar("👧");
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-6 text-center text-white shadow-lg">
        <div className="text-6xl mb-2">👨</div>
        <h2 className="text-2xl font-black">{name}</h2>
        <p className="opacity-80 font-bold">{tier.badge}</p>
        <div className="mt-3 bg-white/20 rounded-2xl px-4 py-2 inline-block">
          <p className="text-sm font-black">{parent_points.toLocaleString()} баллов</p>
        </div>
      </div>

      {/* Stats grid */}
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

      {/* ── ANALYTICS SECTION ── */}
      {children.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1E1B4B]">📊 Аналитика</h2>
              {!isPremium && <PremiumBadge compact />}
            </div>
            <div className="flex items-center gap-2">
              {isPremium && showAnalytics && analyticsData && (
                <button
                  onClick={refreshAnalytics}
                  disabled={analyticsLoading}
                  className="text-xs font-bold text-[#6B7BFF] bg-[#6B7BFF]/10 rounded-xl px-3 py-1.5 active:scale-95 transition-all disabled:opacity-50"
                >
                  {analyticsLoading ? "⏳" : "🔄 Обновить"}
                </button>
              )}
              {isPremium && (
                <button
                  onClick={loadAnalytics}
                  disabled={analyticsLoading}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform disabled:opacity-50 ${
                    showAnalytics
                      ? "bg-gray-100 text-gray-500"
                      : "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white"
                  }`}
                >
                  {analyticsLoading ? "⏳ Загрузка..." : showAnalytics ? "✕ Скрыть" : "📈 Показать"}
                </button>
              )}
            </div>
          </div>

          {isPremium && analyticsError && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
              <p className="text-sm font-bold text-red-500">{analyticsError}</p>
              <button onClick={refreshAnalytics} className="text-xs font-bold text-red-400 underline mt-1">Попробовать снова</button>
            </div>
          )}

          {isPremium && showAnalytics && analyticsData && (
            <div className="space-y-4">
              {analyticsData.length === 0 ? (
                <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="text-sm font-bold text-gray-400">Данных пока нет</p>
                </div>
              ) : (
                analyticsData.map(childData => (
                  <ChildAnalyticsCard key={childData.childId} data={childData} />
                ))
              )}
            </div>
          )}

          {!showAnalytics && !analyticsLoading && (
            <div className={`bg-gradient-to-r from-[#6B7BFF]/8 to-[#9B6BFF]/8 border border-[#6B7BFF]/20 rounded-2xl p-4 flex items-center gap-3 ${!isPremium ? "opacity-60" : ""}`}>
              <span className="text-2xl">📈</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#1E1B4B]">Детальная статистика</p>
                <p className="text-xs text-gray-500 mt-0.5">Задачи, награды, оценки, ачивки по каждому ребёнку</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Children section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E1B4B]">Мои дети</h2>
        <div className="flex items-center gap-2">
          {!isPremium && children.length >= 1 && <PremiumBadge compact />}
          <button
            onClick={() => {
              if (!isPremium && children.length >= 1) return;
              setShowForm(v => !v);
            }}
            className={`text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform ${
              !isPremium && children.length >= 1
                ? "bg-gray-200 text-gray-400"
                : "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white"
            }`}
          >
            {showForm ? "✕ Закрыть" : "+ Добавить"}
          </button>
        </div>
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
              <input type="text" value={childName} onChange={e => setChildName(e.target.value)} placeholder="Имя ребёнка"
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
            <button onClick={handleAdd} disabled={!childName.trim()} className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-sm active:scale-95 transition-transform disabled:opacity-50">
              Добавить ребёнка
            </button>
          </div>
        </div>
      )}

      {children.map(c => {
        const lvl = Math.floor(c.stars / 10) + 1;
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
                <p className="text-sm font-bold text-[#6B7BFF]">ур. {lvl}</p>
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
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">👨‍👧</p>
          <p className="font-bold">Нет детей</p>
          <p className="text-sm mt-1">Нажми «+ Добавить», чтобы создать профиль ребёнка</p>
        </div>
      )}
    </div>
  );
}