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
import { SupportModal } from "@/components/ui/SupportModal";
import { logoutPwa, checkPhone, sendOtp, verifyOtp } from "@/components/pwa/pwaApi";
import { clearPwaSession, getPwaSessionRaw } from "@/components/pwa/usePwaSession";
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
  children: { id: number; name: string; stars: number; avatar: string; age: number; inviteCode: string | null; connected: boolean; pushSubscribed: boolean }[];
  tasks: Task[];
  gradeRequests: GradeRequest[];
  rewards: Reward[];
  rewardWishes: { id: number; childId: number; childName: string; title: string; emoji: string; createdAt: string }[];
  phone_number?: string;
  email?: string;
  is_verified?: boolean;
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
  const [showSupport, setShowSupport] = useState(false);
  const [showVerifyPhone, setShowVerifyPhone] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
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
    if (data?.is_verified === false) {
      showToast("⚠️ Подтвердите аккаунт через телефон или Telegram");
      return;
    }
    const res = await apiCall("parent/child/add", { name, age, avatar });
    if (res.ok) { ymGoal("child_added"); showToast("👶 Ребёнок добавлен!"); load(true); }
    else showToast("❌ " + String(res.error || "Ошибка"));
  }, [data?.is_verified]);

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

  const handleLogout = useCallback(async () => {
    const raw = getPwaSessionRaw();
    if (raw) {
      await logoutPwa(raw.token, raw.role).catch(() => {});
    }
    clearPwaSession();
    window.location.href = "/app";
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

  // В PWA — если имя не заполнено, показываем экран ввода
  const inTelegram = !!(window.Telegram?.WebApp?.initData?.length);
  if (!inTelegram && !data.name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF] p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6 text-center">
          <div className="text-4xl">👋</div>
          <div>
            <h2 className="text-xl font-black text-[#1E1B4B] mb-1">Как вас зовут?</h2>
            <p className="text-sm text-gray-500">Ребёнок будет видеть ваше имя</p>
          </div>
          <input
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-center text-lg font-bold text-[#1E1B4B] focus:outline-none focus:border-[#6B7BFF] transition-colors"
            placeholder="Например: Мария"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={async e => {
              if (e.key === "Enter" && nameInput.trim()) {
                setSavingName(true);
                await apiCall("parent/profile/update", { full_name: nameInput.trim() });
                setSavingName(false);
                load(false);
              }
            }}
            autoFocus
          />
          <button
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-base disabled:opacity-50"
            disabled={savingName || !nameInput.trim()}
            onClick={async () => {
              setSavingName(true);
              await apiCall("parent/profile/update", { full_name: nameInput.trim() });
              setSavingName(false);
              load(false);
            }}
          >
            {savingName ? "Сохраняем..." : "Продолжить →"}
          </button>
        </div>
      </div>
    );
  }

  const streak: StreakState = {
    current: data.streak_current,
    lastActivityDate: data.streak_last_date || "",
    claimedToday: data.streak_claimed_today,
    longestStreak: data.streak_longest,
  };

  // Временно: все пользователи получают полный доступ (Premium отключён)
  const effectiveIsPremium = true;

  const pendingTasks = data.tasks.filter(t => t.status === "pending_confirm" || (t.status === "done" && t.requireConfirm));
  const pendingGrades = data.gradeRequests.filter(g => g.status === "pending");
  const { level } = getParentLevelInfo(data.parent_xp);
  const tip = getParentTip(level);

  const isNewUser = data.children.length === 0 && data.parent_xp === 0;

  if (isNewUser && !onboardingDone) {
    return (
      <ParentOnboarding
        name={data.name}
        parentId={data.id}
        onDone={() => { ymGoal("parent_onboarding_done"); localStorage.setItem("parent_onboarding_done", "1"); setOnboardingDone(true); setTab("profile"); }}
      />
    );
  }

  return (
    <>
    <div className="app-desktop-bg" style={{ fontFamily: "Golos Text, sans-serif" }}>
    <div className="app-shell bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF]">
      {toast && (
        <div className="app-toast fixed top-4 left-4 right-4 z-50 bg-[#1E1B4B] text-white rounded-2xl px-4 py-3 text-sm font-bold shadow-xl text-center" style={{ animation: "slideDown 0.3s ease" }}>
          {toast}
        </div>
      )}

      <SupportModal open={showSupport} onClose={() => setShowSupport(false)} />

      {/* PremiumModal сохранён на будущее */}
      {showPremium && (
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
      )}

      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 font-medium">Добро пожаловать</p>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1E1B4B]">{data.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StreakCard streak={streak} reward={streakReward} compact />
            <button
              onClick={() => setShowSupport(true)}
              className="relative w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 active:scale-95 transition-transform"
              title="Техподдержка"
            >
              💬
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
            </button>
            <button
              onClick={() => setTab("profile")}
              className="w-10 h-10 bg-gradient-to-br from-[#6B7BFF] to-[#9B6BFF] rounded-2xl flex items-center justify-center text-xl shadow-md active:scale-95 transition-transform"
              title="Профиль"
            >
              👤
            </button>
          </div>
        </div>
        <ParentXpBar xp={data.parent_xp} points={data.parent_points} />
        <TipCard tips={PARENT_TIPS} storageKey="parent_tip_dismissed" theme="parent" />
      </div>

      <div className="px-4 pb-32">
        {/* Баннер неверифицированного аккаунта */}
        {data.is_verified === false && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <span className="text-xl mt-0.5">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-black text-amber-800">Подтвердите аккаунт</p>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Добавление детей недоступно. Подтвердите через телефон или Telegram.
              </p>
              <div className="flex gap-2 mt-2.5">
                <a href="https://t.me/parenttask_bot" target="_blank" rel="noreferrer"
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#2AABEE] text-white">
                  ✈️ Telegram
                </a>
                <button
                  onClick={() => setShowVerifyPhone(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#6B7BFF] text-white">
                  📱 Телефон
                </button>
              </div>
            </div>
          </div>
        )}

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
            isPremium={effectiveIsPremium}
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
            isPremium={effectiveIsPremium}
            trialUsed={data.trial_used}
            parentId={data.id}
            onActivateTrial={activateTrial}
            onSubscribe={() => setShowPremium(true)}
            notificationsEnabled={data.notifications_enabled}
            notificationSettings={data.notification_settings}
            onToggleNotifications={async (enabled: boolean, settings?: { tips: boolean; activity: boolean }) => {
              await apiCall("parent/notifications/toggle", { enabled, settings });
              load(true);
            }}
            onLogout={handleLogout}
            onUpdateName={async (newName: string) => {
              await apiCall("parent/profile/update", { full_name: newName });
              load(true);
            }}
            telegramId={data.telegram_id}
            linkedPhone={data.phone_number}
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
    </div>

    {/* Модалка верификации телефона */}
    {showVerifyPhone && (
      <VerifyPhoneModal
        onSuccess={() => { setShowVerifyPhone(false); load(true); }}
        onClose={() => setShowVerifyPhone(false)}
      />
    )}
    </>
  );
}

function VerifyPhoneModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  const formatPhone = (val: string) => {
    const d = val.replace(/\D/g, "").slice(0, 11);
    if (!d.length) return "";
    if (d.length <= 1) return "+7";
    if (d.length <= 4) return `+7 (${d.slice(1)}`;
    if (d.length <= 7) return `+7 (${d.slice(1, 4)}) ${d.slice(4)}`;
    if (d.length <= 9) return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
    return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9, 11)}`;
  };

  const handleSendOtp = async () => {
    setError(""); setLoading(true);
    const res = await sendOtp(phone);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setStep("otp"); setCountdown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const handleDigit = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every(d => d !== "")) handleVerify(next.join(""));
  };

  const handleVerify = async (code?: string) => {
    const c = code || otp.join("");
    if (c.length !== 6) { setError("Введите все 6 цифр."); return; }
    setError(""); setLoading(true);
    const session = getPwaSessionRaw();
    const res = await verifyOtp(phone, c);
    setLoading(false);
    if (res.error) { setError(res.error); setOtp(["", "", "", "", "", ""]); setTimeout(() => otpRefs.current[0]?.focus(), 100); return; }
    // Обновляем сессию если она была PWA
    if (session && res.session_token) {
      const { savePwaSession } = await import("@/components/pwa/usePwaSession");
      savePwaSession(res.session_token, "parent");
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#1E1B4B]">📱 Подтверждение телефона</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">✕</button>
        </div>

        {step === "phone" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Введите номер телефона — пришлём SMS с кодом</p>
            <input
              type="tel" placeholder="+7 (999) 000-00-00"
              value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
              onKeyDown={e => e.key === "Enter" && phone.replace(/\D/g, "").length >= 11 && handleSendOtp()}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-center text-lg font-bold focus:outline-none focus:border-[#6B7BFF]"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button onClick={handleSendOtp} disabled={loading || phone.replace(/\D/g, "").length < 11}
              className="w-full py-3 rounded-xl bg-[#6B7BFF] text-white font-black text-sm disabled:opacity-50">
              {loading ? "Отправляем..." : "Получить SMS-код →"}
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 text-center">Код отправлен на {phone}</p>
            <div className="flex gap-2 justify-center">
              {otp.map((d, i) => (
                <input key={i} ref={el => { otpRefs.current[i] = el; }}
                  type="tel" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => e.key === "Backspace" && !d && i > 0 && otpRefs.current[i - 1]?.focus()}
                  className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#6B7BFF] focus:outline-none"
                />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button onClick={() => handleVerify()} disabled={loading || otp.some(d => !d)}
              className="w-full py-3 rounded-xl bg-[#6B7BFF] text-white font-black text-sm disabled:opacity-50">
              {loading ? "Проверяем..." : "Подтвердить"}
            </button>
            <button onClick={handleSendOtp} disabled={countdown > 0} className="w-full text-sm text-center">
              {countdown > 0
                ? <span className="text-gray-400">Повторить через {countdown} с</span>
                : <span className="text-[#6B7BFF]">Отправить повторно</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}