import { useState } from "react";
import { ParentXpBar } from "./XpBar";
import { StreakCard } from "./StreakCard";
import { ParentGradePanel } from "./GradeExchange";
import { ParentTasksTab, ParentRewardsTab, type PendingConfirmTask } from "./ParentTasksTab";
import { ParentBonusTab } from "./ParentBonusTab";
import { ParentStatsTab, ParentProfileTab } from "./ParentStatsTab";
import {
  getLevelInfo, getLevelEmoji,
  getParentLevelInfo, getParentLevelTier,
  CHILDREN, PARENT_TASKS_LIST, PARENT_ACTION_XP,
  getParentTip,
  type ParentAction, type ParentTab, type StreakState, type GradeRequest, type PhotoProof, type Task,
} from "./types";

// ─── Add child form ───────────────────────────────────────────────────────────

const CHILD_AVATARS = ["👧", "👦", "🧒", "👶"];

function ChildrenTab({ onAction }: { onAction: (a: ParentAction) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [avatar, setAvatar] = useState("👧");
  const [error, setError] = useState("");

  const handleAdd = () => {
    if (!name.trim()) { setError("Введи имя ребёнка"); return; }
    if (age === "" || age < 1 || age > 18) { setError("Укажи возраст от 1 до 18 лет"); return; }
    setError("");
    onAction("child_add");
    setShowForm(false);
    setName("");
    setAge("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1E1B4B]">Мои дети</h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          {showForm ? "✕ Закрыть" : "+ Добавить"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] px-5 py-4">
            <p className="text-white font-black text-base">👶 Добавить ребёнка</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-2">Аватар</label>
              <div className="flex gap-3">
                {CHILD_AVATARS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                      avatar === a ? "bg-gradient-to-br from-[#6B7BFF]/20 to-[#9B6BFF]/20 ring-2 ring-[#6B7BFF] scale-110" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">
                Имя <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Имя ребёнка"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-[#6B7BFF]/40"
              />
            </div>
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-wide block mb-1.5">
                Возраст <span className="text-red-400">*</span>
                <span className="text-gray-300 font-normal ml-1 normal-case">(от этого зависят предметы в школе)</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: 13 }, (_, i) => i + 6).map(a => (
                  <button
                    key={a}
                    onClick={() => setAge(a)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      age === a
                        ? "bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] text-white shadow-sm scale-110"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              {age !== "" && (
                <p className="text-xs text-[#6B7BFF] font-semibold mt-1.5">
                  Возраст {age} лет — {age <= 7 ? "1 класс" : age <= 9 ? "2–3 класс" : age <= 11 ? "4–5 класс" : age <= 13 ? "6–7 класс" : "8–11 класс"}
                </p>
              )}
            </div>
            {error && (
              <p className="text-red-500 text-xs font-bold bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}
            <button
              onClick={handleAdd}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-sm shadow-sm active:scale-95 transition-all"
            >
              Добавить ребёнка
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => onAction("invite_relative")}
        className="w-full bg-white border-2 border-dashed border-[#6B7BFF]/40 rounded-2xl p-4 flex items-center gap-3 hover:border-[#6B7BFF] transition-colors group"
      >
        <span className="text-2xl">👨‍👩‍👧</span>
        <div className="flex-1 text-left">
          <p className="font-bold text-[#1E1B4B] text-sm">Пригласить родственника</p>
          <p className="text-xs text-gray-400">Бабушка, дедушка, тёти и дяди</p>
        </div>
        <span className="text-xs font-bold text-[#6B7BFF] group-hover:translate-x-1 transition-transform">
          +{PARENT_ACTION_XP.invite_relative} XP →
        </span>
      </button>

      {CHILDREN.map(child => {
        const { level: cLevel, xpPct } = getLevelInfo(child.stars);
        const cEmoji = getLevelEmoji(cLevel);
        const pct = child.tasksTotal > 0 ? Math.round(child.tasksDone / child.tasksTotal * 100) : 0;
        return (
          <div key={child.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#6B7BFF]/20 to-[#9B6BFF]/20 rounded-2xl flex items-center justify-center text-3xl">
                {child.avatar}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1E1B4B] text-lg">{child.name}</p>
                <p className="text-sm text-gray-400">{child.age} лет</p>
              </div>
              <div className="text-right">
                <p className="text-yellow-500 font-black text-xl">{child.stars}⭐</p>
                <div className="flex items-center gap-1 justify-end">
                  <span>{cEmoji}</span>
                  <span className="text-sm font-bold text-[#6B7BFF]">ур. {cLevel}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Задачи выполнены</span><span>{pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Опыт до ур. {cLevel + 1}</span><span>{Math.round(xpPct)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ParentView ──────────────────────────────────────────────────────────

type Props = {
  parentTab: ParentTab;
  setParentTab: (tab: ParentTab) => void;
  parentXp: number;
  parentPoints: number;
  streak: StreakState;
  confirmedTasks: number[];
  purchasedPrizes: number[];
  gradeRequests: (GradeRequest & { childId: number; childName: string })[];
  photoProofs: (PhotoProof & { childId: number; childName: string; taskTitle: string })[];
  pendingConfirmTasks: PendingConfirmTask[];
  childNames: { id: number; name: string }[];
  onAction: (action: ParentAction) => void;
  onAddTask: (task: Omit<Task, "id">, childId: number) => void;
  onConfirmTask: (taskId: number, childId?: number) => void;
  onRejectConfirmTask: (childId: number, taskId: number) => void;
  onBuyPrize: (prizeId: number, cost: number) => void;
  onStreakClaim: () => void;
  onApproveGrade: (id: string) => void;
  onRejectGrade: (id: string) => void;
  onApprovePhoto: (childId: number, taskId: number) => void;
  onRejectPhoto: (childId: number, taskId: number) => void;
};

export default function ParentView({
  parentTab, setParentTab,
  parentXp,
  parentPoints,
  streak,
  confirmedTasks,
  purchasedPrizes,
  gradeRequests,
  photoProofs,
  pendingConfirmTasks,
  childNames,
  onAction,
  onAddTask,
  onConfirmTask,
  onRejectConfirmTask,
  onBuyPrize,
  onStreakClaim,
  onApproveGrade,
  onRejectGrade,
  onApprovePhoto,
  onRejectPhoto,
}: Props) {
  const { level } = getParentLevelInfo(parentXp);
  const tier = getParentLevelTier(level);
  const tip = getParentTip(level);

  return (
    <div className="max-w-md mx-auto px-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="mt-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500 font-medium">Добро пожаловать</p>
            <h1 className="text-2xl font-bold text-[#1E1B4B]">Андрей Иванов</h1>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <StreakCard streak={streak} onClaim={onStreakClaim} compact />
              <div className="w-10 h-10 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-2xl flex items-center justify-center text-xl shadow-md">
                👨
              </div>
            </div>
            <span className="text-xs font-bold text-[#6B7BFF]">{tier.emoji} {tier.title}</span>
          </div>
        </div>
        <ParentXpBar xp={parentXp} points={parentPoints} />
      </div>

      {/* Personal tip */}
      <div className="bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 border border-[#6B7BFF]/20 rounded-2xl px-4 py-3 mb-4 flex gap-3 items-start">
        <span className="text-2xl mt-0.5">💡</span>
        <div>
          <p className="text-xs font-bold text-[#6B7BFF] uppercase tracking-wide mb-0.5">Совет уровня {level}</p>
          <p className="text-sm text-gray-600">{tip}</p>
        </div>
      </div>

      {/* Tab content */}
      {parentTab === "tasks" && (
        <ParentTasksTab
          confirmedTasks={confirmedTasks}
          photoProofs={photoProofs}
          pendingConfirmTasks={pendingConfirmTasks}
          childNames={childNames}
          onAction={onAction}
          onAddTask={onAddTask}
          onConfirmTask={onConfirmTask}
          onRejectConfirmTask={onRejectConfirmTask}
          onApprovePhoto={onApprovePhoto}
          onRejectPhoto={onRejectPhoto}
        />
      )}

      {parentTab === "rewards" && <ParentRewardsTab />}

      {parentTab === "grades" && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#1E1B4B]">Оценки детей</h2>
            {gradeRequests.filter(r => r.status === "pending").length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {gradeRequests.filter(r => r.status === "pending").length} новых
              </span>
            )}
          </div>
          <ParentGradePanel
            requests={gradeRequests}
            onApprove={onApproveGrade}
            onReject={onRejectGrade}
          />
        </div>
      )}

      {parentTab === "bonuses" && (
        <ParentBonusTab
          parentPoints={parentPoints}
          parentXp={parentXp}
          streak={streak}
          purchasedPrizes={purchasedPrizes}
          onStreakClaim={onStreakClaim}
          onBuyPrize={onBuyPrize}
        />
      )}

      {parentTab === "stats" && <ParentStatsTab />}

      {parentTab === "children" && <ChildrenTab onAction={onAction} />}

      {parentTab === "profile" && (
        <ParentProfileTab parentXp={parentXp} parentPoints={parentPoints} />
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 px-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl px-2 py-2 flex gap-0.5 border border-white">
          {([
            { key: "tasks",    emoji: "📋", label: "Задачи" },
            { key: "rewards",  emoji: "🎁", label: "Награды" },
            { key: "grades",   emoji: "📝", label: "Оценки" },
            { key: "bonuses",  emoji: "🏅", label: "Бонусы" },
            { key: "children", emoji: "👨‍👧", label: "Дети" },
            { key: "profile",  emoji: "👤", label: "Профиль" },
          ] as { key: ParentTab; emoji: string; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setParentTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-2xl transition-all duration-300 relative ${
                parentTab === tab.key
                  ? "bg-gradient-to-b from-[#6B7BFF] to-[#9B6BFF] scale-110 shadow-md"
                  : "hover:bg-gray-50"
              }`}
            >
              {tab.key === "tasks" && (pendingConfirmTasks.length + photoProofs.filter(p => p.status === "pending_review").length) > 0 && parentTab !== "tasks" && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {pendingConfirmTasks.length + photoProofs.filter(p => p.status === "pending_review").length}
                </span>
              )}
              {tab.key === "grades" && gradeRequests.filter(r => r.status === "pending").length > 0 && parentTab !== "grades" && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {gradeRequests.filter(r => r.status === "pending").length}
                </span>
              )}
              {tab.key === "bonuses" && parentPoints > 0 && parentTab !== "bonuses" && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full text-[9px] font-black text-white flex items-center justify-center">!</span>
              )}
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-[9px] font-black ${parentTab === tab.key ? "text-white" : "text-gray-400"}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}