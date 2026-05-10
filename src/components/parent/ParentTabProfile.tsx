import { useState } from "react";
import PushNotificationToggle from "@/components/pwa/PushNotificationToggle";
import LinkPhoneModal from "@/components/pwa/LinkPhoneModal";
import { SupportModal } from "@/components/ui/SupportModal";

const isTelegramMiniApp = () => {
  const initData = window.Telegram?.WebApp?.initData;
  return typeof initData === "string" && initData.length > 0;
};
const isPwaMode = () => !isTelegramMiniApp();
const getPwaInviteUrl = (code: string) => `${window.location.origin}/invite?code=${code}`;
import { getParentLevelInfo, getParentLevelTier, type StreakState } from "@/lib/gameTypes";
import { ChildAnalyticsCard, type ChildAnalytics } from "./ChildAnalyticsCard";
import { apiCall } from "@/components/miniapp/useApi";
import { StreakCard } from "@/components/ui/StreakCard";

type Child = { id: number; name: string; stars: number; avatar: string; age: number; inviteCode: string | null; connected: boolean };

type StreakReward = {
  todayXp: number;
  todayPoints: number;
  nextXp: number;
  nextPoints: number;
  claimed: boolean;
};

type ProfileProps = {
  name: string;
  parent_points: number;
  parent_xp: number;
  children: Child[];
  tasks_count: number;
  streak_current: number;
  streak: StreakState;
  streakReward?: StreakReward;
  onAddChild: (name: string, age: number, avatar: string) => void;
  onRemoveChild: (id: number) => void;
  onRefreshInvite: (id: number) => void;
  isPremium?: boolean;
  trialUsed?: boolean;
  parentId?: number;
  onUpdateName?: (name: string) => Promise<void>;
  onActivateTrial?: () => Promise<void>;
  onSubscribe?: () => void;
  notificationsEnabled?: boolean;
  notificationSettings?: { tips: boolean; activity: boolean };
  onToggleNotifications?: (enabled: boolean, settings?: { tips: boolean; activity: boolean }) => void;
  onLogout?: () => void;
  telegramId?: number;
  linkedPhone?: string | null;
};

const CHILD_AVATARS = ["👦", "👧", "🧒", "👶", "🐱", "🦊", "🐼", "🦁", "🐸", "🐧", "🦋", "🌟"];

export function ParentTabProfile({ name, parent_points, parent_xp, children, tasks_count, streak_current, streak, streakReward, onAddChild, onRemoveChild, onRefreshInvite, isPremium, trialUsed, parentId, onUpdateName, onActivateTrial, onSubscribe, notificationsEnabled = true, notificationSettings, onToggleNotifications, onLogout, telegramId, linkedPhone }: ProfileProps) {
  const { level } = getParentLevelInfo(parent_xp);
  const tier = getParentLevelTier(level);

  const [showForm, setShowForm] = useState(false);
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState(9);
  const [avatar, setAvatar] = useState("👧");
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Привязка телефона
  const [showLinkPhone, setShowLinkPhone] = useState(false);
  const [currentLinkedPhone, setCurrentLinkedPhone] = useState<string | null>(linkedPhone ?? null);

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
    const pwaUrl = getPwaInviteUrl(code);
    const text = isPwaMode()
      ? `Привет, ${cName}! Я жду тебя в СтарКидс 🌟\n\nПерейди по ссылке и введи своё имя:\n👉 ${pwaUrl}`
      : `Привет! Я жду тебя в приложении СтарКидс 🌟\n\n1️⃣ Открой Telegram → найди @task4kids_bot\n2️⃣ Нажми кнопку «Открыть СтарКидс»\n3️⃣ Введи код: ${code}\n\nИли перейди по ссылке: https://t.me/task4kids_bot?start=${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "СтарКидс — приглашение", text, url: pwaUrl });
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

      {/* ── Объединённая карточка: профиль + стрик + баланс ── */}
      <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl shadow-lg overflow-hidden text-white">

        {/* Верх: имя + тир */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">👤</div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === "Enter" && nameInput.trim()) {
                      setSavingName(true);
                      await onUpdateName?.(nameInput.trim());
                      setSavingName(false);
                      setEditingName(false);
                    }
                    if (e.key === "Escape") { setEditingName(false); setNameInput(name); }
                  }}
                  className="bg-white/20 text-white placeholder-white/60 font-black text-lg text-left rounded-xl px-3 py-1.5 outline-none border-2 border-white/40 focus:border-white flex-1"
                  placeholder="Ваше имя"
                  autoFocus
                />
                <button
                  onClick={async () => {
                    if (!nameInput.trim()) return;
                    setSavingName(true);
                    await onUpdateName?.(nameInput.trim());
                    setSavingName(false);
                    setEditingName(false);
                  }}
                  disabled={savingName || !nameInput.trim()}
                  className="bg-white/30 rounded-xl px-3 py-1.5 text-sm font-bold disabled:opacity-50"
                >
                  {savingName ? "..." : "✓"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black truncate">{name || "Без имени"}</h2>
                {isPwaMode() && (
                  <button
                    onClick={() => { setEditingName(true); setNameInput(name); }}
                    className="bg-white/20 rounded-lg p-1 flex-shrink-0 active:scale-95 transition-transform"
                    title="Изменить имя"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm opacity-80">{tier.badge}</span>
              <span className="text-xs opacity-60">·</span>
              <span className="text-xs opacity-70">Уровень {level}</span>
            </div>
          </div>
          {/* Баллы справа */}
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black">{parent_points.toLocaleString()}</div>
            <div className="text-xs opacity-70">баллов</div>
          </div>
        </div>

        {/* Разделитель */}
        <div className="h-px bg-white/15 mx-5" />

        {/* Стрик */}
        <div className="px-5 py-3">
          <StreakCard streak={streak} reward={streakReward} compact />
        </div>

        {/* Низ: XP прогресс */}
        <div className="px-5 pb-5">
          <div className="bg-white/15 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs opacity-70 font-semibold">Прогресс уровня {level} → {level + 1}</span>
              <span className="text-xs font-black">{parent_xp} XP</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${Math.min(((parent_xp % 100) / 100) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] opacity-60">
              <span>+1 000 баллов за каждый новый уровень</span>
              <span>{100 - (parent_xp % 100)} XP до ур. {level + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ANALYTICS SECTION ── */}
      {children.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1E1B4B]">📊 Аналитика</h2>
            <div className="flex items-center gap-2">
              {showAnalytics && analyticsData && (
                <button
                  onClick={refreshAnalytics}
                  disabled={analyticsLoading}
                  className="text-xs font-bold text-[#6B7BFF] bg-[#6B7BFF]/10 rounded-xl px-3 py-1.5 active:scale-95 transition-all disabled:opacity-50"
                >
                  {analyticsLoading ? "⏳" : "🔄 Обновить"}
                </button>
              )}
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
            </div>
          </div>

          {analyticsError && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
              <p className="text-sm font-bold text-red-500">{analyticsError}</p>
              <button onClick={refreshAnalytics} className="text-xs font-bold text-red-400 underline mt-1">Попробовать снова</button>
            </div>
          )}

          {showAnalytics && analyticsData && (
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
            <div className="bg-gradient-to-r from-[#6B7BFF]/8 to-[#9B6BFF]/8 border border-[#6B7BFF]/20 rounded-2xl p-4 flex items-center gap-3">
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
          {!isPremium && children.length >= 1 && <PremiumBadge compact trialUsed={trialUsed} onActivateTrial={onActivateTrial} onSubscribe={onSubscribe} />}
          <button
            onClick={() => {
              if (!isPremium && children.length >= 1) return;
              setShowForm(v => !v);
            }}
            className={`text-sm font-semibold px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform ${
              !isPremium && children.length >= 1
                ? "bg-gray-200 text-gray-400"
                : children.length === 0
                  ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-lg animate-[addChildPulse_2s_ease-in-out_infinite]"
                  : "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white"
            }`}
          >
            {showForm ? "✕ Закрыть" : children.length === 0 ? "👶 Добавить ребёнка" : "+ Добавить"}
          </button>
        </div>
      </div>

      {children.length === 0 && !showForm && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border-2 border-dashed border-[#6B7BFF]/30 p-6 text-center">
          <div className="text-4xl mb-3">👨‍👧</div>
          <p className="font-bold text-[#1E1B4B] mb-1">Добавьте первого ребёнка</p>
          <p className="text-sm text-gray-500">Чтобы начать давать задания и награждать звёздами</p>
        </div>
      )}

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
                <p className="text-xs font-bold text-green-600 flex-1">{isPwaMode() ? "Ребёнок подключён" : "Telegram подключён"}</p>
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
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide">Как подключить {c.name}:</p>
                      {isPwaMode() ? (
                        <>
                          <p className="text-xs text-gray-600">👆 <b>Нажми кнопку выше и отправь приглашение</b></p>
                          <p className="text-xs text-gray-600">1️⃣ Ребёнок открывает ссылку</p>
                          <p className="text-xs text-gray-600">2️⃣ Вводит своё имя и готово ✅</p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-gray-600">👆 <b>Нажми на код выше и перешли его ребёнку</b></p>
                          <p className="text-xs text-gray-600">1️⃣ Ребёнок открывает Telegram → находит <b>@task4kids_bot</b></p>
                          <p className="text-xs text-gray-600">2️⃣ Нажимает <b>«Открыть СтарКидс»</b></p>
                          <p className="text-xs text-gray-600">3️⃣ Вводит код <b>{c.inviteCode}</b></p>
                        </>
                      )}
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

      {/* Привязка телефона — только в Telegram */}
      {!isPwaMode() && telegramId && (
        <div className="bg-white/90 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <p className="font-bold text-[#1E1B4B] text-sm">Телефон для PWA</p>
                <p className="text-xs text-gray-400">
                  {currentLinkedPhone ? currentLinkedPhone : "Не привязан"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLinkPhone(true)}
              className="text-xs font-bold text-[#6B7BFF] bg-[#6B7BFF]/10 px-3 py-1.5 rounded-xl active:scale-95 transition-transform"
            >
              {currentLinkedPhone ? "Изменить" : "Привязать"}
            </button>
          </div>
          {!currentLinkedPhone && (
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              Привяжите телефон, чтобы входить в приложение без Telegram
            </p>
          )}
        </div>
      )}

      {/* Notifications settings — только в Telegram */}
      {!isPwaMode() && <div className="bg-white/90 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-bold text-[#1E1B4B] text-sm">Уведомления Telegram</p>
              <p className="text-xs text-gray-400">Настройте, что получать в Telegram</p>
            </div>
          </div>
          <button
            onClick={() => onToggleNotifications?.(!notificationsEnabled)}
            className={`w-12 h-7 rounded-full transition-all duration-300 relative ${notificationsEnabled ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF]" : "bg-gray-300"}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${notificationsEnabled ? "left-6" : "left-1"}`} />
          </button>
        </div>
        {notificationsEnabled && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-sm">✅</span>
                <div>
                  <p className="text-xs font-bold text-[#1E1B4B]">Важные</p>
                  <p className="text-[10px] text-gray-400">Проверки, оценки, желания</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">Всегда вкл</span>
            </div>
            {[
              { key: "tips" as const, icon: "💡", title: "Советы", desc: "Задания за день, добавление детей" },
              { key: "activity" as const, icon: "🔥", title: "Активность", desc: "Стрик, неактивность ребёнка" },
            ].map(cat => (
              <div key={cat.key} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-[#1E1B4B]">{cat.title}</p>
                    <p className="text-[10px] text-gray-400">{cat.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = { ...notificationSettings, [cat.key]: !notificationSettings?.[cat.key] };
                    onToggleNotifications?.(true, next);
                  }}
                  className={`w-10 h-6 rounded-full transition-all duration-300 relative ${notificationSettings?.[cat.key] !== false ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF]" : "bg-gray-300"}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${notificationSettings?.[cat.key] !== false ? "left-5" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>}

      {/* Push-уведомления — только PWA */}
      {isPwaMode() && <PushNotificationToggle parentId={parentId} autoSubscribe />}

      <SupportModal open={showSupport} onClose={() => setShowSupport(false)} />

      {/* Поддержка */}
      <button
        onClick={() => setShowSupport(true)}
        className="w-full bg-white/90 rounded-3xl p-4 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform text-left"
      >
        <span className="text-2xl">💬</span>
        <div className="flex-1">
          <p className="font-bold text-[#1E1B4B] text-sm">Техническая поддержка</p>
          <p className="text-xs text-gray-400">Ответим в течение рабочего дня</p>
        </div>
        <span className="text-gray-300 text-sm">→</span>
      </button>

      {/* Legal */}
      <div className="bg-white/90 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">📄</span>
          <div>
            <p className="font-bold text-[#1E1B4B] text-sm">Документы</p>
            <p className="text-xs text-gray-400">Политика, условия, согласие на ПДн</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <a href="/legal?tab=privacy" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl active:scale-[0.98] transition-transform">
            <span className="text-xs font-bold text-[#1E1B4B]">🔒 Политика конфиденциальности</span>
            <span className="text-gray-300 text-xs">→</span>
          </a>
          <a href="/legal?tab=terms" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl active:scale-[0.98] transition-transform">
            <span className="text-xs font-bold text-[#1E1B4B]">📋 Условия использования</span>
            <span className="text-gray-300 text-xs">→</span>
          </a>
          <a href="/legal?tab=consent" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl active:scale-[0.98] transition-transform">
            <span className="text-xs font-bold text-[#1E1B4B]">✅ Согласие на обработку ПДн</span>
            <span className="text-gray-300 text-xs">→</span>
          </a>
          <a href="/legal?tab=about" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl active:scale-[0.98] transition-transform">
            <span className="text-xs font-bold text-[#1E1B4B]">ℹ️ О проекте</span>
            <span className="text-gray-300 text-xs">→</span>
          </a>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-3">
          © 2026 СтарКидс · 0+ · Самозанятый Кругов М.Г. · ИНН 772379179900
        </p>
      </div>

      {/* Модалка привязки телефона */}
      {showLinkPhone && telegramId && (
        <LinkPhoneModal
          telegramId={telegramId}
          onSuccess={(phone) => {
            setCurrentLinkedPhone(phone);
            setShowLinkPhone(false);
          }}
          onClose={() => setShowLinkPhone(false)}
        />
      )}

      {/* Выход — только в PWA */}
      {isPwaMode() && onLogout && (
        <div className="pb-4">
          {!confirmLogout ? (
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full py-3 rounded-2xl bg-gray-100 text-gray-400 font-bold text-sm active:scale-95 transition-transform"
            >
              Выйти из аккаунта
            </button>
          ) : (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100 space-y-3">
              <p className="text-sm font-bold text-center text-[#1E1B4B]">Выйти из аккаунта?</p>
              <p className="text-xs text-gray-400 text-center">Для входа потребуется SMS-подтверждение</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={onLogout}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm active:scale-95 transition-transform"
                >
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}