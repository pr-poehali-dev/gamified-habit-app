import { useState, useEffect, useCallback, useRef } from "react";
import { tg } from "@/components/miniapp/types";
import { apiCall } from "@/components/miniapp/useApi";
import { getLevelInfo, getLevelTier, getLevelEmoji, LEVEL_TIERS, STARS_PER_LEVEL, getSubjectsByAge, GRADE_STARS, type GradeValue } from "@/components/demo/types";
import { XpBar, LevelUpModal } from "@/components/demo/XpBar";
import { AchievementGrid } from "@/components/demo/AchievementBadge";
import { type AchievementId } from "@/components/demo/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChildData = {
  role: "child";
  id: number; name: string; stars: number; age: number;
  avatar: string; telegram_id: number; parent_id: number;
  level: number; xpInLevel: number;
  achievements: AchievementId[];
  stickers: { stickerId: string; count: number }[];
  gradeRequests: GradeReq[];
  tasks: Task[];
};

type Task = {
  id: number; title: string; stars: number; emoji: string;
  status: string; requirePhoto: boolean; requireConfirm: boolean; photoStatus: string;
};

type GradeReq = {
  id: number; subject: string; grade: number; date: string;
  status: string; starsAwarded: number | null; createdAt: string;
};

type ChildTab = "tasks" | "stars" | "grades" | "achievements" | "profile";

// ─── Loading / Error ──────────────────────────────────────────────────────────

function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]">
      <div className="text-5xl mb-4 animate-bounce">⭐</div>
      <p className="text-[#2D1B69] font-black text-lg">Загружаем профиль...</p>
      <div className="mt-4 w-8 h-8 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]">
      <div className="text-5xl mb-4">😕</div>
      <p className="text-[#2D1B69] font-bold text-xl mb-2">Что-то пошло не так</p>
      <p className="text-gray-500 text-sm">{msg}</p>
      <p className="text-gray-400 text-xs mt-3">Зайди через @task4kids_bot</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ChildMiniApp() {
  const [data, setData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ChildTab>("tasks");
  const [toast, setToast] = useState<string | null>(null);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevLevelRef = useRef<number>(1);

  // Grade form
  const [gradeSubject, setGradeSubject] = useState("");
  const [gradeValue, setGradeValue] = useState<GradeValue>(5);
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().slice(0, 10));
  const [gradeSent, setGradeSent] = useState(false);

  useEffect(() => {
    const webapp = tg();
    if (webapp) { webapp.ready(); webapp.expand(); }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const tgId = tg()?.initDataUnsafe?.user?.id;
    const res = await apiCall("child/auth", tgId ? { telegram_id: tgId } : {});
    if (res.role === "child") {
      const d = res as unknown as ChildData;
      const lvl = getLevelInfo(d.stars).level;
      prevLevelRef.current = lvl;
      if (gradeSubject === "") {
        setGradeSubject(getSubjectsByAge(d.age || 9)[0]);
      }
      setData(d);
    } else if (res.role === "unknown") {
      setError("Аккаунт не найден. Зарегистрируйся через @task4kids_bot");
    } else {
      setError(String(res.error || "Ошибка авторизации"));
    }
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const completeTask = useCallback(async (taskId: number) => {
    tg()?.HapticFeedback?.impactOccurred("light");
    const res = await apiCall("child/complete", { task_id: taskId });
    if (res.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      if (res.pending_confirm) {
        showToast("⏳ Отправлено на проверку родителю!");
      } else {
        showToast(`🎉 +${res.stars_earned}⭐ начислено!`);
      }
      load();
    } else {
      showToast("❌ " + String(res.error || "Ошибка"));
    }
  }, []);

  const submitGrade = useCallback(async () => {
    if (!gradeSubject) return;
    setGradeSent(true);
    const res = await apiCall("child/grade/submit", {
      subject: gradeSubject, grade: gradeValue, date: gradeDate,
    });
    if (res.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      showToast("📝 Запрос отправлен родителю!");
      load();
    } else {
      showToast("❌ " + String(res.error || "Ошибка"));
    }
    setTimeout(() => setGradeSent(false), 2000);
  }, [gradeSubject, gradeValue, gradeDate]);

  useEffect(() => {
    if (!data) return;
    const newLevel = getLevelInfo(data.stars).level;
    if (newLevel > prevLevelRef.current) {
      setLevelUpLevel(newLevel);
      tg()?.HapticFeedback?.notificationOccurred("success");
    }
    prevLevelRef.current = newLevel;
  }, [data?.stars]);

  if (loading) return <Loading />;
  if (error || !data) return <ErrorScreen msg={error || "Нет данных"} />;

  const { level } = getLevelInfo(data.stars);
  const levelEmoji = getLevelEmoji(level);
  const subjects = getSubjectsByAge(data.age || 9);
  const pendingGrades = data.gradeRequests.filter(g => g.status === "pending");

  const pendingTasks = data.tasks.filter(t => t.status === "pending");
  const doneTasks = data.tasks.filter(t => t.status === "pending_confirm" || t.status === "done");
  const approvedTasks = data.tasks.filter(t => t.status === "approved");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]" style={{ fontFamily: "Nunito, sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#2D1B69] text-white rounded-2xl px-4 py-3 text-sm font-bold shadow-xl text-center" style={{ animation: "slideDown 0.3s ease" }}>
          {toast}
        </div>
      )}

      {levelUpLevel !== null && <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />}

      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-black text-[#2D1B69]">Привет, {data.name}! 👋</h1>
            <p className="text-sm text-gray-400 font-semibold">{data.age} лет · Выполняй задания!</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-white/80 rounded-2xl px-3 py-2 text-center shadow-sm">
              <p className="text-yellow-500 text-xl font-black">{data.stars}</p>
              <p className="text-gray-400 text-xs font-bold">звёзд ⭐</p>
            </div>
            <div className="bg-white/80 rounded-2xl px-3 py-2 text-center shadow-sm">
              <p className="text-[#2D1B69] text-xl font-black">{level}</p>
              <p className="text-gray-400 text-xs font-bold">ур. {levelEmoji}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm">
          <XpBar stars={data.stars} />
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pb-32 space-y-3">

        {/* Tasks */}
        {tab === "tasks" && (
          <>
            <h2 className="text-lg font-black text-[#2D1B69]">Мои задачи</h2>

            {/* Pending confirm */}
            {doneTasks.map(task => (
              <div key={task.id} className="rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-r from-amber-300 to-orange-400 shadow-sm">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white/20">{task.emoji}</div>
                <div className="flex-1">
                  <p className="font-black text-base text-white">{task.title}</p>
                  <p className="text-white/80 text-sm font-bold">⏳ Ждёт проверки родителя</p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/30">
                  <span className="text-lg">⏳</span>
                </div>
              </div>
            ))}

            {/* Active */}
            {pendingTasks.map((task, i) => (
              <div key={task.id}
                onClick={() => completeTask(task.id)}
                className="rounded-3xl p-4 flex items-center gap-4 cursor-pointer bg-white/90 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 shadow-sm"
                style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br from-[#FF9BE0]/20 to-[#9B6BFF]/20">{task.emoji}</div>
                <div className="flex-1">
                  <p className="font-black text-base text-[#2D1B69]">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-sm font-bold text-yellow-500">{task.stars}⭐</p>
                    {task.requireConfirm && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">✅ нужна проверка</span>}
                    {task.requirePhoto && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">📸 нужно фото</span>}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B]">
                  <span className="text-white text-sm">→</span>
                </div>
              </div>
            ))}

            {/* Approved */}
            {approvedTasks.map(task => (
              <div key={task.id} className="rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-r from-green-400 to-emerald-500 scale-[0.98] shadow-sm">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white/20">{task.emoji}</div>
                <div className="flex-1">
                  <p className="font-black text-base text-white line-through opacity-80">{task.title}</p>
                  <p className="text-white/70 text-sm font-bold">+{task.stars}⭐ начислено</p>
                </div>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/30">
                  <span className="text-white text-base">✓</span>
                </div>
              </div>
            ))}

            {data.tasks.length === 0 && (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🎉</div>
                <p className="font-bold text-gray-500">Все задачи выполнены!</p>
              </div>
            )}
          </>
        )}

        {/* Stars */}
        {tab === "stars" && (
          <>
            <h2 className="text-lg font-black text-[#2D1B69]">Мои звёзды</h2>
            <div className="bg-gradient-to-br from-[#FFD700] to-[#FF9500] rounded-3xl p-6 text-center shadow-lg">
              <div className="text-7xl mb-2">⭐</div>
              <div className="text-5xl font-black text-white">{data.stars}</div>
              <div className="text-white/80 font-bold mt-1">звёзд собрано</div>
            </div>
            <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-3xl p-5 text-center shadow-lg">
              <div className="text-5xl mb-1">{levelEmoji}</div>
              <div className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">{getLevelTier(level).title} · Уровень {level}</div>
              <div className="mt-3">
                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${getLevelInfo(data.stars).xpPct}%` }} />
                </div>
                <p className="text-white/70 text-xs mt-1.5">
                  {getLevelInfo(data.stars).xpInLevel}/10 XP · до ур. {level + 1} ещё {STARS_PER_LEVEL - getLevelInfo(data.stars).xpInLevel}⭐
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
        )}

        {/* Grades */}
        {tab === "grades" && (
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
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">Предмет ({data.age} лет)</label>
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
                <button onClick={submitGrade} disabled={gradeSent}
                  className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${gradeSent ? "bg-green-500 text-white" : "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white shadow-md"}`}>
                  {gradeSent ? "✅ Запрос отправлен!" : "📤 Отправить родителю"}
                </button>
              </div>
            </div>

            {/* History */}
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

            {data.gradeRequests.filter(g => g.status !== "pending").length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">История</p>
                {data.gradeRequests.filter(g => g.status !== "pending").map(g => (
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
        )}

        {/* Achievements */}
        {tab === "achievements" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#2D1B69]">Мои ачивки</h2>
              <span className="text-sm font-bold text-gray-400">{data.achievements.length}/16</span>
            </div>
            <AchievementGrid unlockedIds={data.achievements} />
          </>
        )}

        {/* Profile */}
        {tab === "profile" && (
          <>
            <div className="bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B] rounded-3xl p-6 text-center text-white shadow-lg">
              <div className="text-6xl mb-2">{data.avatar}</div>
              <h2 className="text-2xl font-black">{data.name}</h2>
              <p className="opacity-80 font-bold">{data.age} лет</p>
              <div className="mt-3 flex items-center justify-center gap-2 bg-white/20 rounded-2xl px-4 py-2">
                <span className="text-xl">{levelEmoji}</span>
                <span className="font-black text-lg">Уровень {level}</span>
              </div>
            </div>
            <div className="bg-white/80 rounded-2xl px-4 py-3 shadow-sm">
              <XpBar stars={data.stars} showTierHint />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Звёзд", value: data.stars, emoji: "⭐" },
                { label: "Уровень", value: level, emoji: levelEmoji },
                { label: "Задач выполнено", value: approvedTasks.length, emoji: "✅" },
                { label: "Ачивок", value: data.achievements.length, emoji: "🏅" },
              ].map(s => (
                <div key={s.label} className="bg-white/90 rounded-3xl p-4 text-center shadow-sm">
                  <div className="text-3xl mb-1">{s.emoji}</div>
                  <div className="text-2xl font-black text-[#2D1B69]">{s.value}</div>
                  <div className="text-xs font-bold text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-2 py-2 flex gap-0.5 border border-white">
          {([
            { key: "tasks",        emoji: "📋", label: "Задачи",   badge: pendingTasks.length + doneTasks.length },
            { key: "stars",        emoji: "⭐", label: "Звёзды",   badge: 0 },
            { key: "grades",       emoji: "📝", label: "Оценки",   badge: pendingGrades.length, locked: level < 2 },
            { key: "achievements", emoji: "🏅", label: "Ачивки",   badge: 0 },
            { key: "profile",      emoji: "👤", label: "Профиль",  badge: 0 },
          ] as { key: ChildTab; emoji: string; label: string; badge: number; locked?: boolean }[]).map(t => (
            <button key={t.key}
              onClick={() => { tg()?.HapticFeedback?.impactOccurred("light"); setTab(t.key); }}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-2xl transition-all duration-300 relative ${tab === t.key ? "bg-gradient-to-b from-[#FF6B9D] to-[#FF9B6B] scale-110 shadow-md" : t.locked ? "opacity-50" : "hover:bg-gray-50"}`}>
              {t.locked && tab !== t.key && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full text-[9px] font-black text-white flex items-center justify-center">🔒</span>
              )}
              {t.badge > 0 && !t.locked && tab !== t.key && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">{t.badge}</span>
              )}
              <span className="text-lg">{t.emoji}</span>
              <span className={`text-[9px] font-black ${tab === t.key ? "text-white" : "text-gray-400"}`}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
