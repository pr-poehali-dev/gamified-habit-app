import { useState, useEffect, useCallback, useRef } from "react";
import { tg } from "@/components/miniapp/types";
import { apiCall } from "@/components/miniapp/useApi";
import { StreakCard } from "@/components/ui/StreakCard";
import { ParentXpBar } from "@/components/ui/XpBar";
import { getParentLevelInfo, getParentLevelTier, getParentTip, type StreakState } from "@/lib/gameTypes";
import { Loading, ErrorScreen } from "@/components/parent/ParentScreens";
import { ParentTabTasks } from "@/components/parent/ParentTabTasks";
import { ParentTabGrades, ParentTabChildren, ParentTabBonuses, ParentTabProfile, ParentTabPartners } from "@/components/parent/ParentTabContent";
import { ParentBottomNav, type ParentTab } from "@/components/parent/ParentBottomNav";
import { ParentOnboarding } from "@/components/parent/ParentOnboarding";

const POLL_INTERVAL = 10_000; // 10 секунд

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
  photoUrl?: string | null;
  childName?: string;
  deadline?: string | null;
  extensionRequested?: boolean;
  extensionGranted?: boolean;
};

type GradeRequest = {
  id: number; childId: number; childName: string;
  subject: string; grade: number; date: string;
  status: string; starsAwarded: number | null;
};

type Reward = { id: number; title: string; cost: number; emoji: string; childId: number | null; quantity: number };

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ParentMiniApp() {
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [tab, setTab] = useState<ParentTab>("tasks");
  const [toast, setToast] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem("parent_onboarding_done"));
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const webapp = tg();
    if (webapp) { webapp.ready(); webapp.expand(); }
    load(false);

    // Запускаем polling
    pollingRef.current = setInterval(() => {
      if (!document.hidden) {
        load(true);
      }
    }, POLL_INTERVAL);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const webapp = tg();
    const tgId = webapp?.initDataUnsafe?.user?.id;
    const firstName = webapp?.initDataUnsafe?.user?.first_name || "";
    const initDataLen = webapp?.initData?.length ?? 0;

    if (!silent) setDebugInfo(`tg: ${webapp ? "✓" : "✗"} | id: ${tgId ?? "—"} | initData: ${initDataLen}б`);

    const res = await apiCall("parent/auth", {
      ...(tgId ? { telegram_id: tgId, first_name: firstName } : {}),
    });
    if (res.role === "parent") {
      setData(res as unknown as ParentData);
    } else if (res.role === "unknown") {
      if (!silent) {
        setTimeout(() => load(false), 1000);
        return;
      }
    } else {
      if (!silent) setError("Не удалось подключиться. Попробуй открыть через @parenttask_bot");
    }
    if (!silent) setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    tg()?.HapticFeedback?.notificationOccurred("success");
    setTimeout(() => setToast(null), 3000);
  };

  const confirmTask = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/confirm", { task_id: taskId, confirm_action: "approve" });
    if (res.ok) { showToast("✅ Задача подтверждена!"); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const rejectTask = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/confirm", { task_id: taskId, confirm_action: "reject" });
    if (res.ok) { showToast("↩️ Задача возвращена"); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const approveGrade = useCallback(async (reqId: number) => {
    const res = await apiCall("parent/grade/approve", { request_id: reqId, action: "approve" });
    if (res.ok) { showToast(`🌟 Оценка подтверждена! +${res.stars_awarded}⭐`); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const rejectGrade = useCallback(async (reqId: number) => {
    const res = await apiCall("parent/grade/approve", { request_id: reqId, action: "reject" });
    if (res.ok) { showToast("↩️ Оценка отклонена"); load(false); }
  }, []);

  const addTask = useCallback(async (newTask: { title: string; stars: number; emoji: string; childId: number; requirePhoto: boolean; requireConfirm: boolean; deadline: string | null }) => {
    const res = await apiCall("parent/task/add", { ...newTask, child_id: newTask.childId, require_photo: newTask.requirePhoto, require_confirm: newTask.requireConfirm, deadline: newTask.deadline });
    if (res.ok) { showToast("📋 Задача создана!"); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, [data]);

  const grantExtension = useCallback(async (taskId: number, hours: number) => {
    const res = await apiCall("parent/task/extension", { task_id: taskId, extension_action: "grant", hours });
    if (res.ok) { showToast(`⏰ Продлено на ${hours}ч!`); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const denyExtension = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/extension", { task_id: taskId, extension_action: "deny" });
    if (res.ok) { showToast("✗ Запрос на продление отклонён"); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const claimStreak = useCallback(async () => {
    const res = await apiCall("parent/streak/claim");
    if (res.ok) { showToast(`🔥 +${res.xp} XP и +${res.points} баллов!`); load(false); }
    else showToast(String(res.error || "Уже получено сегодня"));
  }, []);

  const addChild = useCallback(async (name: string, age: number, avatar: string) => {
    const res = await apiCall("parent/child/add", { name, age, avatar });
    if (res.ok) { showToast("👶 Ребёнок добавлен!"); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const refreshInvite = useCallback(async (childId: number) => {
    const res = await apiCall("parent/child/invite", { child_id: childId });
    if (res.ok) { showToast("🔑 Новый код создан!"); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const removeChild = useCallback(async (childId: number) => {
    const res = await apiCall("parent/child/remove", { child_id: childId });
    if (res.ok) { showToast("🗑 Профиль удалён"); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const addReward = useCallback(async (title: string, cost: number, emoji: string, childId: number, quantity: number) => {
    const res = await apiCall("parent/reward/add", { title, cost, emoji, child_id: childId, quantity });
    if (res.ok) { showToast("🎁 Награда добавлена!"); load(false); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const removeReward = useCallback(async (rewardId: number) => {
    const res = await apiCall("parent/reward/remove", { reward_id: rewardId });
    if (res.ok) { showToast("🗑 Награда удалена"); load(false); }
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

  const pendingTasks = data.tasks.filter(t => t.status === "pending_confirm" || (t.status === "done" && t.requireConfirm));
  const pendingGrades = data.gradeRequests.filter(g => g.status === "pending");
  const { level } = getParentLevelInfo(data.parent_xp);
  const tip = getParentTip(level);

  const isNewUser = data.children.length === 0 && data.parent_xp === 0;

  if (isNewUser && !onboardingDone) {
    return (
      <ParentOnboarding
        name={data.name}
        onDone={() => { localStorage.setItem("parent_onboarding_done", "1"); setOnboardingDone(true); setTab("children"); }}
      />
    );
  }

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
            onGrantExtension={grantExtension}
            onDenyExtension={denyExtension}
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
            rewards={data.rewards}
            children={data.children}
            onAddReward={addReward}
            onRemoveReward={removeReward}
          />
        )}
        {tab === "partners" && (
          <ParentTabPartners
            parent_points={data.parent_points}
            parent_xp={data.parent_xp}
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