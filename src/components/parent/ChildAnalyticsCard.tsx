import { useState } from "react";
import { getLevelTier, ACHIEVEMENTS_MAP } from "@/lib/gameTypes";

const ACHIEVEMENTS = ACHIEVEMENTS_MAP;

const GRADE_COLORS: Record<string, string> = {
  "5": "bg-emerald-500",
  "4": "bg-blue-400",
  "3": "bg-amber-400",
  "2": "bg-red-400",
};
const GRADE_LABELS: Record<string, string> = {
  "5": "Отлично",
  "4": "Хорошо",
  "3": "Удовл.",
  "2": "Плохо",
};

export type ChildAnalytics = {
  childId: number;
  name: string;
  avatar: string;
  age: number;
  level: number;
  starsBalance: number;
  totalStarsEarned: number;
  starsSpent: number;
  starsFromTasks: number;
  starsFromGrades: number;
  tasks: {
    total: number;
    completed: number;
    pending: number;
    pendingConfirm: number;
    overdue: number;
    withPhoto: number;
    last7d: number;
    last30d: number;
    completedLast7d: number;
    completedLast30d: number;
    completionRate: number;
  };
  rewards: {
    bought: number;
    starsSpent: number;
    topRewards: { title: string; emoji: string; count: number }[];
  };
  grades: {
    total: number;
    approved: number;
    avgGrade: number;
    starsFromGrades: number;
    topSubjects: { subject: string; avgGrade: number; count: number }[];
    distribution: Record<string, number>;
  };
  achievements: { id: string; unlockedAt: string }[];
  weeklyActivity: { week: string; tasksDone: number; starsEarned: number }[];
};

type Tab = "overview" | "tasks" | "rewards" | "grades" | "achievements";

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
        active
          ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm"
          : "text-gray-500 bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function StatBox({ emoji, value, label, color = "text-[#1E1B4B]" }: { emoji: string; value: string | number; label: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3 text-center">
      <div className="text-2xl mb-0.5">{emoji}</div>
      <div className={`text-xl font-black ${color}`}>{value}</div>
      <div className="text-[10px] font-bold text-gray-400 leading-tight">{label}</div>
    </div>
  );
}

function MiniBar({ value, max, color = "bg-[#6B7BFF]" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ChildAnalyticsCard({ data }: { data: ChildAnalytics }) {
  const [tab, setTab] = useState<Tab>("overview");
  const tier = getLevelTier(data.level);

  const unlockedAchievementIds = data.achievements.map(a => a.id);
  const totalAchievements = Object.keys(ACHIEVEMENTS).length;

  // Вычисляем максимум для баров недельной активности
  const maxWeeklyTasks = Math.max(...data.weeklyActivity.map(w => w.tasksDone), 1);

  // Распределение оценок для визуализации
  const totalGrades = Object.values(data.grades.distribution).reduce((s, v) => s + v, 0);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">{data.avatar}</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-lg leading-tight">{data.name}</p>
          <p className="text-white/70 text-xs font-medium">{data.age} лет · {tier.emoji} {tier.title} · Ур. {data.level}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-black text-xl">{data.starsBalance}⭐</p>
          <p className="text-white/70 text-[10px]">баланс</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
        <TabButton label="Обзор" active={tab === "overview"} onClick={() => setTab("overview")} />
        <TabButton label="Задачи" active={tab === "tasks"} onClick={() => setTab("tasks")} />
        <TabButton label="Награды" active={tab === "rewards"} onClick={() => setTab("rewards")} />
        <TabButton label="Оценки" active={tab === "grades"} onClick={() => setTab("grades")} />
        <TabButton label="Ачивки" active={tab === "achievements"} onClick={() => setTab("achievements")} />
      </div>

      <div className="px-4 pb-5 pt-1">
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-4">
            {/* Ключевые метрики */}
            <div className="grid grid-cols-2 gap-2">
              <StatBox emoji="⭐" value={data.totalStarsEarned} label="Всего заработано" color="text-yellow-500" />
              <StatBox emoji="🛍️" value={data.starsSpent} label="Потрачено звёзд" color="text-purple-500" />
              <StatBox emoji="✅" value={data.tasks.completed} label="Задач выполнено" color="text-emerald-600" />
              <StatBox emoji="🏆" value={`${unlockedAchievementIds.length}/${totalAchievements}`} label="Ачивок получено" color="text-amber-500" />
            </div>

            {/* Прогресс-индикатор */}
            <div className="bg-gradient-to-r from-[#6B7BFF]/8 to-[#9B6BFF]/8 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-black text-[#6B7BFF] uppercase tracking-wide">Баланс звёзд</p>
              <div className="flex items-center justify-between text-sm font-bold text-gray-600">
                <span>Заработано: <span className="text-emerald-600">{data.totalStarsEarned}⭐</span></span>
                <span>Потрачено: <span className="text-purple-600">{data.starsSpent}⭐</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                {data.totalStarsEarned > 0 && (
                  <>
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-l-full"
                      style={{ width: `${Math.max(((data.totalStarsEarned - data.starsSpent) / data.totalStarsEarned) * 100, 0)}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-r-full"
                      style={{ width: `${Math.min((data.starsSpent / data.totalStarsEarned) * 100, 100)}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex gap-3 text-[10px] font-bold text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />На балансе: {data.starsBalance}⭐</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-400 rounded-full inline-block" />Потрачено: {data.starsSpent}⭐</span>
              </div>
            </div>

            {/* Источники звёзд */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Источники звёзд</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <span>📋 За задачи</span>
                    <span className="text-emerald-600">{data.starsFromTasks}⭐</span>
                  </div>
                  <MiniBar value={data.starsFromTasks} max={data.totalStarsEarned} color="bg-emerald-400" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <span>📚 За оценки</span>
                    <span className="text-blue-600">{data.starsFromGrades}⭐</span>
                  </div>
                  <MiniBar value={data.starsFromGrades} max={data.totalStarsEarned} color="bg-blue-400" />
                </div>
              </div>
            </div>

            {/* Активность за последние 4 недели */}
            {data.weeklyActivity.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Активность (4 недели)</p>
                <div className="flex items-end gap-2 h-16">
                  {data.weeklyActivity.map((w, i) => {
                    const h = maxWeeklyTasks > 0 ? Math.max((w.tasksDone / maxWeeklyTasks) * 100, 8) : 8;
                    const date = new Date(w.week);
                    const label = `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex items-end justify-center" style={{ height: "48px" }}>
                          <div
                            className="w-full bg-gradient-to-t from-[#6B7BFF] to-[#9B6BFF] rounded-t-lg transition-all duration-500"
                            style={{ height: `${h}%` }}
                          />
                        </div>
                        <p className="text-[9px] font-bold text-gray-400">{label}</p>
                        <p className="text-[9px] font-black text-[#6B7BFF]">{w.tasksDone}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] font-bold text-gray-400 text-center mt-1">задач выполнено по неделям</p>
              </div>
            )}
          </div>
        )}

        {/* ── TASKS ── */}
        {tab === "tasks" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatBox emoji="📋" value={data.tasks.total} label="Всего задач" />
              <StatBox emoji="✅" value={data.tasks.completed} label="Выполнено" color="text-emerald-600" />
              <StatBox emoji="⏳" value={data.tasks.pending} label="В процессе" color="text-amber-500" />
              <StatBox emoji="🔍" value={data.tasks.pendingConfirm} label="На проверке" color="text-blue-500" />
            </div>

            {/* Процент выполнения */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-black text-emerald-700 uppercase tracking-wide">Процент выполнения</p>
                <p className="text-2xl font-black text-emerald-600">{data.tasks.completionRate}%</p>
              </div>
              <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${data.tasks.completionRate}%` }}
                />
              </div>
              {data.tasks.overdue > 0 && (
                <p className="text-[10px] font-bold text-red-500 mt-2">⚠️ Просроченных: {data.tasks.overdue}</p>
              )}
            </div>

            {/* За периоды */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Активность за период</p>
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <span>За 7 дней</span>
                    <span className="text-[#6B7BFF]">{data.tasks.completedLast7d} выполнено из {data.tasks.last7d} новых</span>
                  </div>
                  <MiniBar value={data.tasks.completedLast7d} max={Math.max(data.tasks.last7d, 1)} />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                    <span>За 30 дней</span>
                    <span className="text-[#6B7BFF]">{data.tasks.completedLast30d} выполнено из {data.tasks.last30d} новых</span>
                  </div>
                  <MiniBar value={data.tasks.completedLast30d} max={Math.max(data.tasks.last30d, 1)} />
                </div>
              </div>
            </div>

            {/* Доп. факты */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-blue-600">{data.tasks.withPhoto}</p>
                <p className="text-[10px] font-bold text-blue-500">📸 с фото-отчётом</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-yellow-600">{data.starsFromTasks}⭐</p>
                <p className="text-[10px] font-bold text-yellow-600">за задачи</p>
              </div>
            </div>
          </div>
        )}

        {/* ── REWARDS ── */}
        {tab === "rewards" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatBox emoji="🎁" value={data.rewards.bought} label="Куплено наград" color="text-purple-600" />
              <StatBox emoji="💸" value={`${data.starsSpent}⭐`} label="Потрачено звёзд" color="text-purple-600" />
            </div>

            {data.rewards.topRewards.length > 0 ? (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Любимые награды</p>
                <div className="space-y-2.5">
                  {data.rewards.topRewards.map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-2xl w-8 text-center">{r.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-700 truncate">{r.title}</p>
                        <MiniBar value={r.count} max={data.rewards.topRewards[0].count} color="bg-purple-400" />
                      </div>
                      <span className="text-xs font-black text-purple-600 bg-purple-100 rounded-xl px-2 py-0.5">{r.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <p className="text-3xl mb-2">🛍️</p>
                <p className="text-sm font-bold text-gray-400">Пока нет покупок</p>
                <p className="text-xs text-gray-300 mt-1">Добавь награды в магазин!</p>
              </div>
            )}

            {/* Соотношение: заработано / потрачено */}
            {data.totalStarsEarned > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4">
                <p className="text-xs font-black text-purple-700 uppercase tracking-wide mb-2">Коэффициент трат</p>
                <p className="text-2xl font-black text-purple-700 mb-1">
                  {Math.round((data.starsSpent / data.totalStarsEarned) * 100)}%
                </p>
                <p className="text-[10px] font-bold text-purple-500">от всех заработанных звёзд потрачено на награды</p>
              </div>
            )}
          </div>
        )}

        {/* ── GRADES ── */}
        {tab === "grades" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatBox emoji="📝" value={data.grades.total} label="Оценок подано" />
              <StatBox emoji="✅" value={data.grades.approved} label="Подтверждено" color="text-emerald-600" />
              <StatBox
                emoji="📊"
                value={data.grades.avgGrade > 0 ? data.grades.avgGrade.toFixed(1) : "—"}
                label="Средний балл"
                color={
                  data.grades.avgGrade >= 4.5 ? "text-emerald-600"
                  : data.grades.avgGrade >= 3.5 ? "text-blue-500"
                  : data.grades.avgGrade >= 2.5 ? "text-amber-500"
                  : "text-red-500"
                }
              />
              <StatBox emoji="⭐" value={`${data.grades.starsFromGrades}`} label="Звёзд за оценки" color="text-yellow-500" />
            </div>

            {/* Распределение оценок */}
            {totalGrades > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Распределение оценок</p>
                {["5", "4", "3", "2"].map(g => {
                  const cnt = data.grades.distribution[g] || 0;
                  const pct = totalGrades > 0 ? Math.round((cnt / totalGrades) * 100) : 0;
                  return (
                    <div key={g} className="flex items-center gap-3">
                      <div className={`w-6 h-6 ${GRADE_COLORS[g]} rounded-lg flex items-center justify-center text-white font-black text-xs`}>{g}</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-0.5">
                          <span>{GRADE_LABELS[g]}</span>
                          <span>{cnt} ({pct}%)</span>
                        </div>
                        <MiniBar value={cnt} max={totalGrades} color={GRADE_COLORS[g]} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Топ предметов */}
            {data.grades.topSubjects.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-black text-blue-700 uppercase tracking-wide">Лучшие предметы</p>
                {data.grades.topSubjects.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-base">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                    <span className="flex-1 text-sm font-bold text-gray-700">{s.subject}</span>
                    <span className="text-xs font-black text-blue-600 bg-blue-100 rounded-xl px-2 py-0.5">{s.avgGrade.toFixed(1)} ср.</span>
                    <span className="text-xs text-gray-400">{s.count}×</span>
                  </div>
                ))}
              </div>
            )}

            {data.grades.total === 0 && (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <p className="text-3xl mb-2">📚</p>
                <p className="text-sm font-bold text-gray-400">Оценок ещё нет</p>
              </div>
            )}
          </div>
        )}

        {/* ── ACHIEVEMENTS ── */}
        {tab === "achievements" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-2xl px-4 py-3">
              <div>
                <p className="text-xs font-black text-amber-700 uppercase tracking-wide">Прогресс</p>
                <p className="text-2xl font-black text-amber-600 mt-0.5">{unlockedAchievementIds.length}/{totalAchievements}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl">🏆</p>
              </div>
            </div>

            {/* Прогрессбар ачивок */}
            <div className="bg-amber-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-700"
                style={{ width: `${(unlockedAchievementIds.length / totalAchievements) * 100}%` }}
              />
            </div>

            {/* Сетка ачивок */}
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
                const unlocked = unlockedAchievementIds.includes(id);
                const unlockedAt = data.achievements.find(a => a.id === id)?.unlockedAt;
                return (
                  <div
                    key={id}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl text-center transition-all ${
                      unlocked
                        ? "bg-gradient-to-b from-amber-50 to-yellow-50 border border-amber-200 shadow-sm"
                        : "bg-gray-50 opacity-35"
                    }`}
                  >
                    <span className="text-2xl">{ach.emoji}</span>
                    <p className="text-[9px] font-bold text-gray-600 leading-tight">{ach.title}</p>
                    {unlocked && unlockedAt && (
                      <p className="text-[8px] text-amber-500 font-bold">{new Date(unlockedAt).toLocaleDateString("ru", { day: "numeric", month: "short" })}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Последние полученные */}
            {data.achievements.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide">Последние получены</p>
                {[...data.achievements]
                  .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
                  .slice(0, 3)
                  .map((a, i) => {
                    const ach = ACHIEVEMENTS[a.id];
                    if (!ach) return null;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xl">{ach.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-700">{ach.title}</p>
                          <p className="text-[10px] text-gray-400">{new Date(a.unlockedAt).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}