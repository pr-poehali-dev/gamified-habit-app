import { StreakCard } from "@/components/demo/StreakCard";
import { getParentLevelInfo, getParentLevelTier, PARTNER_PRIZES, type StreakState } from "@/components/demo/types";

type Child = { id: number; name: string; stars: number; avatar: string; age: number };
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
};

type BonusesProps = {
  streak: StreakState;
  parent_points: number;
  parent_xp: number;
  onClaimStreak: () => void;
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

export function ParentTabChildren({ children }: ChildrenProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#1E1B4B]">Мои дети</h2>
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
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ParentTabBonuses({ streak, parent_points, parent_xp, onClaimStreak }: BonusesProps) {
  const { level } = getParentLevelInfo(parent_xp);
  const tier = getParentLevelTier(level);

  return (
    <div className="space-y-4">
      <StreakCard streak={streak} onClaim={onClaimStreak} />
      <div className="bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-3xl p-5 text-white shadow-lg">
        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Ваш баланс</p>
        <p className="text-4xl font-black">{parent_points.toLocaleString()} <span className="text-2xl font-bold">баллов</span></p>
        <p className="text-white/70 text-xs mt-2">+1 000 баллов за каждый новый уровень</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg">{tier.emoji}</span>
          <span className="text-sm font-bold">{tier.badge}</span>
        </div>
      </div>
      <div>
        <h3 className="text-base font-bold text-[#1E1B4B] mb-3">Магазин призов</h3>
        {PARTNER_PRIZES.map(prize => {
          const canBuy = parent_points >= prize.cost;
          return (
            <div key={prize.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 flex items-start gap-3">
              <span className="text-3xl">{prize.emoji}</span>
              <div className="flex-1">
                <p className="font-bold text-[#1E1B4B] text-sm">{prize.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">от {prize.partner}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-sm font-black text-amber-600">{prize.cost.toLocaleString()} б.</p>
                <button disabled={!canBuy} className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${canBuy ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white active:scale-95" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                  Обменять
                </button>
              </div>
            </div>
          );
        })}
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
