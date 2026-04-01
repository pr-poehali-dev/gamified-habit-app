import { useState, useEffect, useCallback } from "react";
import { tg } from "@/components/miniapp/types";
import { apiCall } from "@/components/miniapp/useApi";
import { StreakCard } from "@/components/demo/StreakCard";
import { ParentXpBar } from "@/components/demo/XpBar";
import { getParentLevelInfo, getParentLevelTier, getParentTip, type StreakState } from "@/components/demo/types";
import { Loading, ErrorScreen } from "@/components/parent/ParentScreens";
import { ParentTabTasks } from "@/components/parent/ParentTabTasks";
import { ParentTabGrades, ParentTabChildren, ParentTabBonuses, ParentTabProfile } from "@/components/parent/ParentTabContent";
import { ParentBottomNav, type ParentTab } from "@/components/parent/ParentBottomNav";

// ─── Types ────────────────────────────────────────────────────────────────────

type ParentData = {
  role: "parent";
  id: number;
  name: string;
  telegram_id: number;
  parent_xp: number;
  parent_points: number;
  streak_current: number;
  streak_last_date: string | null;
  streak_claimed_today: boolean;
  streak_longest: number;
  children: { id: number; name: string; stars: number; avatar: string; age: number; inviteCode: string | null; connected: boolean }[];
  tasks: Task[];
  gradeRequests: GradeRequest[];
  rewards: Reward[];
};

type Task = {
  id: number; title: string; stars: number; emoji: string;
  status: string; childId: number; requirePhoto: boolean;
  requireConfirm: boolean; photoStatus: string;
  childName?: string;
};

type GradeRequest = {
  id: number; childId: number; childName: string;
  subject: string; grade: number; date: string;
  status: string; starsAwarded: number | null;
};

type Reward = { id: number; title: string; cost: number; emoji: string };

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ParentMiniApp() {
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [tab, setTab] = useState<ParentTab>("tasks");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const webapp = tg();
    if (webapp) { webapp.ready(); webapp.expand(); }
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const webapp = tg();
    const tgId = webapp?.initDataUnsafe?.user?.id;
    const firstName = webapp?.initDataUnsafe?.user?.first_name || "";
    const initDataLen = webapp?.initData?.length ?? 0;

    setDebugInfo(`tg: ${webapp ? "✓" : "✗"} | id: ${tgId ?? "—"} | initData: ${initDataLen}б`);

    const res = await apiCall("parent/auth", {
      ...(tgId ? { telegram_id: tgId, first_name: firstName } : {}),
    });
    if (res.role === "parent") {
      setData(res as unknown as ParentData);
    } else if (res.role === "unknown") {
      setTimeout(() => load(), 1000);
      return;
    } else {
      setError("Не удалось подключиться. Попробуй открыть через @parenttask_bot");
    }
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    tg()?.HapticFeedback?.notificationOccurred("success");
    setTimeout(() => setToast(null), 3000);
  };

  const confirmTask = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/confirm", { task_id: taskId, action: "approve" });
    if (res.ok) { showToast("✅ Задача подтверждена!"); load(); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const rejectTask = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/confirm", { task_id: taskId, action: "reject" });
    if (res.ok) { showToast("↩️ Задача возвращена"); load(); }
  }, []);

  const approveGrade = useCallback(async (reqId: number) => {
    const res = await apiCall("parent/grade/approve", { request_id: reqId, action: "approve" });
    if (res.ok) { showToast(`🌟 Оценка подтверждена! +${res.stars_awarded}⭐`); load(); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const rejectGrade = useCallback(async (reqId: number) => {
    const res = await apiCall("parent/grade/approve", { request_id: reqId, action: "reject" });
    if (res.ok) { showToast("↩️ Оценка отклонена"); load(); }
  }, []);

  const addTask = useCallback(async (newTask: { title: string; stars: number; emoji: string; childId: number; requirePhoto: boolean; requireConfirm: boolean }) => {
    const res = await apiCall("parent/task/add", { ...newTask, child_id: newTask.childId, require_photo: newTask.requirePhoto, require_confirm: newTask.requireConfirm });
    if (res.ok) { showToast("📋 Задача создана!"); load(); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, [data]);

  const claimStreak = useCallback(async () => {
    const res = await apiCall("parent/streak/claim");
    if (res.ok) { showToast(`🔥 +${res.xp} XP и +${res.points} баллов!`); load(); }
    else showToast(String(res.error || "Уже получено сегодня"));
  }, []);

  const addChild = useCallback(async (name: string, age: number, avatar: string) => {
    const res = await apiCall("parent/child/add", { name, age, avatar });
    if (res.ok) { showToast("👶 Ребёнок добавлен!"); load(); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const refreshInvite = useCallback(async (childId: number) => {
    const res = await apiCall("parent/child/invite", { child_id: childId });
    if (res.ok) { showToast("🔑 Новый код создан!"); load(); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const removeChild = useCallback(async (childId: number) => {
    const res = await apiCall("parent/child/remove", { child_id: childId });
    if (res.ok) { showToast("🗑 Профиль удалён"); load(); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  if (loading) return <Loading debug={debugInfo} />;
  if (error || !data) return <ErrorScreen msg={error || "Нет данных"} />;

  const streak: StreakState = {
    current: data.streak_current,
    lastActivityDate: data.streak_last_date || "",
    claimedToday: data.streak_claimed_today,
    longestStreak: data.streak_longest,
  };

  const pendingTasks = data.tasks.filter(t => t.status === "pending_confirm" || t.status === "done");
  const pendingGrades = data.gradeRequests.filter(g => g.status === "pending");
  const { level } = getParentLevelInfo(data.parent_xp);
  const tip = getParentTip(level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF]" style={{ fontFamily: "Golos Text, sans-serif" }}>
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#1E1B4B] text-white rounded-2xl px-4 py-3 text-sm font-bold shadow-xl text-center" style={{ animation: "slideDown 0.3s ease" }}>
          {toast}
        </div>
      )}

      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 font-medium">Добро пожаловать</p>
            <h1 className="text-xl font-bold text-[#1E1B4B]">{data.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StreakCard streak={streak} onClaim={claimStreak} compact />
            <div className="w-10 h-10 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-2xl flex items-center justify-center text-xl shadow-md">👨</div>
          </div>
        </div>
        <ParentXpBar xp={data.parent_xp} points={data.parent_points} />
        <div className="mt-3 bg-gradient-to-r from-[#6B7BFF]/10 to-[#9B6BFF]/10 border border-[#6B7BFF]/20 rounded-2xl px-4 py-3 flex gap-3 items-start">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-xs font-bold text-[#6B7BFF] uppercase tracking-wide mb-0.5">Совет уровня {level}</p>
            <p className="text-sm text-gray-600">{tip}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-32">
        {tab === "tasks" && (
          <ParentTabTasks
            tasks={data.tasks}
            children={data.children}
            pendingTasks={pendingTasks}
            onConfirmTask={confirmTask}
            onRejectTask={rejectTask}
            onAddTask={addTask}
          />
        )}
        {tab === "grades" && (
          <ParentTabGrades
            gradeRequests={data.gradeRequests}
            pendingGrades={pendingGrades}
            onApproveGrade={approveGrade}
            onRejectGrade={rejectGrade}
          />
        )}
        {tab === "children" && (
          <ParentTabChildren
            children={data.children}
            onAddChild={addChild}
            onRemoveChild={removeChild}
            onRefreshInvite={refreshInvite}
          />
        )}
        {tab === "bonuses" && (
          <ParentTabBonuses
            streak={streak}
            parent_points={data.parent_points}
            parent_xp={data.parent_xp}
            onClaimStreak={claimStreak}
          />
        )}
        {tab === "profile" && (
          <ParentTabProfile
            name={data.name}
            parent_points={data.parent_points}
            parent_xp={data.parent_xp}
            children={data.children}
            tasks_count={data.tasks.length}
            streak_current={data.streak_current}
          />
        )}
      </div>

      <ParentBottomNav
        tab={tab}
        onTabChange={setTab}
        pendingTasksCount={pendingTasks.length}
        pendingGradesCount={pendingGrades.length}
      />
    </div>
  );
}