import { useState, useEffect, useCallback, useRef } from "react";
import { tg } from "@/components/miniapp/types";
import { apiCall } from "@/components/miniapp/useApi";
import { StreakCard } from "@/components/ui/StreakCard";
import { ParentXpBar } from "@/components/ui/XpBar";
import { getParentLevelInfo, getParentLevelTier, getParentTip, PARENT_TIPS, type StreakState } from "@/lib/gameTypes";
import { TipCard } from "@/components/ui/TipCard";
import { Loading, ErrorScreen } from "@/components/parent/ParentScreens";
import { ParentTabTasks } from "@/components/parent/ParentTabTasks";
import { ParentTabGrades, ParentTabBonuses, ParentTabProfile, ParentTabPartners } from "@/components/parent/ParentTabContent";
import { ParentBottomNav, type ParentTab } from "@/components/parent/ParentBottomNav";
import { ParentOnboarding } from "@/components/parent/ParentOnboarding";
import { PremiumModal } from "@/components/parent/PremiumModal";
import ymGoal from "@/lib/ym";

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
  is_premium: boolean;
  is_premium_paid: boolean;
  trial_active: boolean;
  trial_days_left: number;
  trial_used: boolean;
  trial_ends_at: string | null;
  streakReward: { justClaimed: boolean; todayXp: number; todayPoints: number; nextXp: number; nextPoints: number; claimed: boolean };
  children: { id: number; name: string; stars: number; avatar: string; age: number; inviteCode: string | null; connected: boolean }[];
  tasks: Task[];
  gradeRequests: GradeRequest[];
  rewards: Reward[];
  rewardWishes: { id: number; childId: number; childName: string; title: string; emoji: string; createdAt: string }[];
  phone_number?: string;
  notifications_enabled: boolean;
  notification_settings: { tips: boolean; activity: boolean };
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
  
  const [tab, setTab] = useState<ParentTab>("tasks");
  const [toast, setToast] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem("parent_onboarding_done"));
  const [showPremium, setShowPremium] = useState(false);
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

    const res = await apiCall("parent/auth", {
      ...(tgId ? { telegram_id: tgId, first_name: firstName } : {}),
    });
    if (res.role === "parent") {
      const d = res as unknown as ParentData;
      if (!silent && !localStorage.getItem("ym_parent_auth")) {
        ymGoal("parent_auth");
        localStorage.setItem("ym_parent_auth", "1");
      }
      if (!silent && d.streakReward?.justClaimed) {
        setTimeout(() => {
          setToast(`🔥 День ${d.streak_current}! +${d.streakReward.todayXp} XP и +${d.streakReward.todayPoints} баллов`);
          tg()?.HapticFeedback?.notificationOccurred("success");
          setTimeout(() => setToast(null), 4000);
        }, 800);
      }
      setData(d);
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
    if (res.ok) { showToast("✅ Задача подтверждена!"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const rejectTask = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/confirm", { task_id: taskId, confirm_action: "reject" });
    if (res.ok) { showToast("↩️ Задача возвращена"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const approveGrade = useCallback(async (reqId: number) => {
    const res = await apiCall("parent/grade/approve", { request_id: reqId, grade_action: "approve" });
    if (res.ok) { showToast(`🌟 Оценка подтверждена! +${res.stars_awarded}⭐`); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const rejectGrade = useCallback(async (reqId: number) => {
    const res = await apiCall("parent/grade/approve", { request_id: reqId, grade_action: "reject" });
    if (res.ok) { showToast("↩️ Оценка отклонена"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const addTask = useCallback(async (newTask: { title: string; stars: number; emoji: string; childId: number; requirePhoto: boolean; requireConfirm: boolean; deadline: string | null }) => {
    const res = await apiCall("parent/task/add", { ...newTask, child_id: newTask.childId, require_photo: newTask.requirePhoto, require_confirm: newTask.requireConfirm, deadline: newTask.deadline });
    if (res.ok) { ymGoal("task_created"); showToast("📋 Задача создана!"); load(true); }
    else if (res.error === "premium_required") showToast("👑 Фото-задачи доступны в Premium");
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, [data]);

  const grantExtension = useCallback(async (taskId: number, hours: number) => {
    const res = await apiCall("parent/task/extension", { task_id: taskId, extension_action: "grant", hours });
    if (res.ok) { showToast(`⏰ Продлено на ${hours}ч!`); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const denyExtension = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/extension", { task_id: taskId, extension_action: "deny" });
    if (res.ok) { showToast("✗ Запрос на продление отклонён"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const deleteTask = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/delete", { task_id: taskId });
    if (res.ok) { showToast("🗑 Задание удалено"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const cancelTask = useCallback(async (taskId: number) => {
    const res = await apiCall("parent/task/cancel", { task_id: taskId });
    if (res.ok) { showToast("✕ Задание отменено"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const streakReward = data?.streakReward;

  const addChild = useCallback(async (name: string, age: number, avatar: string) => {
    const res = await apiCall("parent/child/add", { name, age, avatar });
    if (res.ok) { ymGoal("child_added"); showToast("👶 Ребёнок добавлен!"); load(true); }
    else if (res.error === "premium_required") showToast("👑 Несколько детей доступно в Premium");
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const refreshInvite = useCallback(async (childId: number) => {
    const res = await apiCall("parent/child/invite", { child_id: childId });
    if (res.ok) { showToast("🔑 Новый код создан!"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const removeChild = useCallback(async (childId: number) => {
    const res = await apiCall("parent/child/remove", { child_id: childId });
    if (res.ok) { showToast("🗑 Профиль удалён"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const addReward = useCallback(async (title: string, cost: number, emoji: string, childId: number, quantity: number) => {
    const res = await apiCall("parent/reward/add", { title, cost, emoji, child_id: childId, quantity });
    if (res.ok) { ymGoal("reward_created"); showToast("🎁 Награда добавлена!"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const removeReward = useCallback(async (rewardId: number) => {
    const res = await apiCall("parent/reward/remove", { reward_id: rewardId });
    if (res.ok) { showToast("🗑 Награда удалена"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const dismissWish = useCallback(async (wishId: number) => {
    const res = await apiCall("parent/wish/dismiss", { wish_id: wishId });
    if (res.ok) { load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  const activateTrial = useCallback(async () => {
    const res = await apiCall("parent/trial/activate", {});
    if (res.ok) { ymGoal("trial_activated"); showToast("🎉 Пробный период активирован на 7 дней!"); setShowPremium(false); load(true); }
    else if (res.error === "trial_already_used") showToast("Пробный период уже был использован");
    else if (res.error === "already_premium") showToast("У вас уже есть Premium");
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, []);

  if (loading) return <Loading />;
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
        onDone={() => { ymGoal("parent_onboarding_done"); localStorage.setItem("parent_onboarding_done", "1"); setOnboardingDone(true); setTab("profile"); }}
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

      <PremiumModal
        open={showPremium}
        onClose={() => setShowPremium(false)}
        isPremium={data.is_premium}
        isPremiumPaid={data.is_premium_paid}
        trialActive={data.trial_active}
        trialDaysLeft={data.trial_days_left}
        trialUsed={data.trial_used}
        onActivateTrial={activateTrial}
        parentName={data.name}
        parentPhone={data.phone_number}
        parentTelegramId={data.telegram_id}
        parentId={data.id}
      />

      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 font-medium">Добро пожаловать</p>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1E1B4B]">{data.name}</h1>
              <button
                onClick={() => { ymGoal("premium_modal_open"); setShowPremium(true); }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black active:scale-95 transition-transform ${
                  data.is_premium
                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm"
                    : "bg-gray-200 text-gray-500"
                }`}>
                {data.trial_active ? `👑 Trial · ${data.trial_days_left}д` : data.is_premium_paid ? "👑 Premium" : "👑 Premium"}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StreakCard streak={streak} reward={streakReward} compact />
            <div className="w-10 h-10 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-2xl flex items-center justify-center text-xl shadow-md">👨</div>
          </div>
        </div>
        <ParentXpBar xp={data.parent_xp} points={data.parent_points} />
        <TipCard tips={PARENT_TIPS} storageKey="parent_tip_dismissed" theme="parent" />
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
            onDeleteTask={deleteTask}
            onCancelTask={cancelTask}
            isPremium={data.is_premium}
            trialUsed={data.trial_used}
            onActivateTrial={activateTrial}
            onSubscribe={() => setShowPremium(true)}
            onGoToProfile={() => setTab("profile")}
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
        {tab === "bonuses" && (
          <ParentTabBonuses
            rewards={data.rewards}
            children={data.children}
            onAddReward={addReward}
            onRemoveReward={removeReward}
            rewardWishes={data.rewardWishes || []}
            onDismissWish={dismissWish}
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
            streak={streak}
            streakReward={streakReward}
            onAddChild={addChild}
            onRemoveChild={removeChild}
            onRefreshInvite={refreshInvite}
            isPremium={data.is_premium}
            trialUsed={data.trial_used}
            onActivateTrial={activateTrial}
            onSubscribe={() => setShowPremium(true)}
            notificationsEnabled={data.notifications_enabled}
            notificationSettings={data.notification_settings}
            onToggleNotifications={async (enabled: boolean, settings?: { tips: boolean; activity: boolean }) => {
              await apiCall("parent/notifications/toggle", { enabled, settings });
              load(true);
            }}
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