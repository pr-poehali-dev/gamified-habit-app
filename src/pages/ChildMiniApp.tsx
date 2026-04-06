import { useState, useEffect, useCallback, useRef } from "react";
import { tg } from "@/components/miniapp/types";
import { apiCall } from "@/components/miniapp/useApi";
import { getLevelInfo, getLevelEmoji, getSubjectsByAge, CHILD_TIPS, type GradeValue, type AchievementId } from "@/lib/gameTypes";
import { XpBar, LevelUpModal } from "@/components/ui/XpBar";
import { TipCard } from "@/components/ui/TipCard";
import { Loading, ErrorScreen } from "@/components/child/ChildScreens";
import { ChildTabTasks } from "@/components/child/ChildTabTasks";
import { ChildTabShop, ChildTabGrades, ChildTabProfile } from "@/components/child/ChildTabContent";
import { ChildBottomNav, type ChildTab } from "@/components/child/ChildBottomNav";
import { ChildOnboarding } from "@/components/child/ChildOnboarding";
import { ChildConnectScreen } from "@/components/child/ChildConnectScreen";
import { ChildTabFriends } from "@/components/child/ChildTabFriends";
import ymGoal from "@/lib/ym";

// ─── Types ────────────────────────────────────────────────────────────────────

type Reward = { id: number; title: string; cost: number; emoji: string; childId: number | null; quantity: number };

type RewardPurchase = {
  id: number;
  rewardId: number;
  title: string;
  emoji: string;
  cost: number;
  status: string;
  purchasedAt: string;
};

type ChildData = {
  role: "child";
  id: number; name: string; stars: number; age: number;
  avatar: string; telegram_id: number; parent_id: number;
  level: number; xpInLevel: number;
  total_stars_earned: number;
  achievements: AchievementId[];
  stickers: { stickerId: string; count: number }[];
  gradeRequests: GradeReq[];
  tasks: Task[];
  rewards: Reward[];
  rewardPurchases: RewardPurchase[];
  wishes: { id: number; title: string; emoji: string; status: string; createdAt: string }[];
};

type Task = {
  id: number; title: string; stars: number; emoji: string;
  status: string; requirePhoto: boolean; requireConfirm: boolean; photoStatus: string;
  deadline?: string | null;
  extensionRequested?: boolean;
  extensionGranted?: boolean;
};

type GradeReq = {
  id: number; subject: string; grade: number; date: string;
  status: string; starsAwarded: number | null; createdAt: string;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 10_000; // 10 секунд

export default function ChildMiniApp() {
  const [data, setData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ChildTab>("tasks");
  const [toast, setToast] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(() => !!localStorage.getItem("child_onboarding_done"));
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [friendRequests, setFriendRequests] = useState(0);
  const prevLevelRef = useRef<number>(1);
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
    const tgId = tg()?.initDataUnsafe?.user?.id;
    const res = await apiCall("child/auth", tgId ? { telegram_id: tgId } : {});
    if (res.role === "child") {
      const d = res as unknown as ChildData;
      // Если total_stars_earned не пришёл с сервера — используем stars как fallback
      if (!d.total_stars_earned) d.total_stars_earned = d.stars;
      const lvl = getLevelInfo(d.total_stars_earned).level;
      if (!silent) prevLevelRef.current = lvl;
      // Запоминаем, что ребёнок был успешно подключён
      localStorage.setItem("child_was_connected", "1");
      if (!silent && !localStorage.getItem("ym_child_auth")) {
        ymGoal("child_auth");
        localStorage.setItem("ym_child_auth", "1");
      }
      setData(d);
      apiCall("child/friends/list", {}).then(fr => {
        if (fr.ok) setFriendRequests(((fr.incoming as unknown[]) || []).length);
      });
    } else if (res.role === "unknown") {
      if (!silent) setError("not_connected");
    } else {
      if (!silent) setError(String(res.error || "Ошибка авторизации"));
    }
    if (!silent) setLoading(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const completeTask = useCallback(async (taskId: number, photoBase64?: string) => {
    tg()?.HapticFeedback?.impactOccurred("light");
    const body: Record<string, unknown> = { task_id: taskId };

    // Если есть фото — сначала загружаем его отдельно в S3, затем передаём URL
    if (photoBase64) {
      showToast("📤 Загружаю фото...");
      const uploadRes = await apiCall("child/upload_photo", { task_id: taskId, photo_base64: photoBase64 });
      if (!uploadRes.ok) {
        if (uploadRes.error === "premium_required") {
          showToast("👑 Фотоотчёт доступен в Premium-подписке родителя");
        } else {
          showToast("❌ Ошибка загрузки фото: " + String(uploadRes.error || "Попробуй снова"));
        }
        return;
      }
      body.photo_url = uploadRes.photo_url;
    }

    const res = await apiCall("child/complete", body);
    if (res.ok) {
      ymGoal("task_completed");
      tg()?.HapticFeedback?.notificationOccurred("success");
      if (res.pending_confirm) {
        showToast("⏳ Отправлено на проверку родителю!");
      } else {
        showToast(`🎉 +${res.stars_earned}⭐ начислено!`);
      }
      load(false);
    } else {
      showToast("❌ " + String(res.error || "Ошибка"));
    }
  }, []);

  const submitGrade = useCallback(async (subject: string, grade: GradeValue, date: string) => {
    const res = await apiCall("child/grade/submit", { subject, grade, date });
    if (res.ok) {
      ymGoal("grade_submitted");
      tg()?.HapticFeedback?.notificationOccurred("success");
      showToast("📝 Запрос отправлен родителю!");
      load(false);
    } else {
      showToast("❌ " + String(res.error || "Ошибка"));
    }
  }, []);

  const requestExtension = useCallback(async (taskId: number) => {
    tg()?.HapticFeedback?.impactOccurred("light");
    const res = await apiCall("child/task/request_extension", { task_id: taskId });
    if (res.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      showToast("⏰ Запрос на доп. время отправлен родителю!");
      load(false);
    } else {
      showToast("❌ " + String(res.error || "Ошибка"));
    }
  }, []);

  const deleteTask = useCallback(async (taskId: number) => {
    const res = await apiCall("child/task/delete", { task_id: taskId });
    if (res.ok) {
      showToast("🗑 Задание убрано из списка");
      load(false);
    } else {
      showToast("❌ " + String(res.error || "Ошибка"));
    }
  }, []);

  const buyReward = useCallback(async (rewardId: number) => {
    tg()?.HapticFeedback?.impactOccurred("medium");
    const res = await apiCall("child/reward/buy", { reward_id: rewardId });
    if (res.ok) {
      ymGoal("reward_purchased");
      tg()?.HapticFeedback?.notificationOccurred("success");
      showToast("🎁 Награда куплена! Родитель получил уведомление.");
      load(false);
    } else {
      showToast("❌ " + String(res.error || "Не хватает звёзд"));
    }
  }, []);

  const addWish = useCallback(async (title: string, emoji: string) => {
    const res = await apiCall("child/wish/add", { title, emoji });
    if (res.ok) {
      showToast("💫 Запрос отправлен родителю!");
      load(true);
    } else if (res.error === "too_many_wishes") {
      showToast("Можно запросить не больше 10 наград");
    } else {
      showToast("❌ " + String(res.error || "Ошибка"));
    }
  }, []);

  const deleteWish = useCallback(async (wishId: number) => {
    const res = await apiCall("child/wish/delete", { wish_id: wishId });
    if (res.ok) { load(true); }
  }, []);

  useEffect(() => {
    if (!data) return;
    // Уровень считается от total_stars_earned, а не от текущего баланса
    const newLevel = getLevelInfo(data.total_stars_earned ?? data.stars).level;
    if (newLevel > prevLevelRef.current) {
      setLevelUpLevel(newLevel);
      tg()?.HapticFeedback?.notificationOccurred("success");
    }
    prevLevelRef.current = newLevel;
  }, [data?.total_stars_earned]);

  if (loading) return <Loading />;
  if (error === "not_connected") {
    const wasConnected = !!localStorage.getItem("child_was_connected");
    return (
      <ChildConnectScreen
        onConnected={() => {
          setError(null);
          load(false);
        }}
        wasDeleted={wasConnected}
      />
    );
  }
  if (error || !data) return <ErrorScreen msg={error || "Нет данных"} />;

  const isNewChild = data.stars === 0 && data.tasks.length === 0;

  if (isNewChild && !onboardingDone) {
    return (
      <ChildOnboarding
        name={data.name}
        onDone={() => { ymGoal("child_onboarding_done"); localStorage.setItem("child_onboarding_done", "1"); setOnboardingDone(true); }}
      />
    );
  }

  // Уровень и XP считаются от всех заработанных звёзд (не списываются при покупках)
  const { level } = getLevelInfo(data.total_stars_earned ?? data.stars);
  const levelEmoji = getLevelEmoji(level);
  const pendingGrades = data.gradeRequests.filter(g => g.status === "pending");
  const pendingTasks = data.tasks.filter(t => t.status === "pending");
  const doneTasks = data.tasks.filter(t => t.status === "pending_confirm");
  const approvedTasks = data.tasks.filter(t => t.status === "approved" || t.status === "done");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]" style={{ fontFamily: "Nunito, sans-serif" }}>
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-[#2D1B69] text-white rounded-2xl px-4 py-3 text-sm font-bold shadow-xl text-center" style={{ animation: "slideDown 0.3s ease" }}>
          {toast}
        </div>
      )}

      {levelUpLevel !== null && <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />}

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
          <XpBar stars={data.total_stars_earned ?? data.stars} />
        </div>
        <TipCard tips={CHILD_TIPS} storageKey="child_tip_dismissed" theme="child" />
      </div>

      <div className="px-4 pb-32 space-y-3">
        {tab === "tasks" && (
          <ChildTabTasks
            tasks={data.tasks}
            pendingTasks={pendingTasks}
            doneTasks={doneTasks}
            approvedTasks={approvedTasks}
            onCompleteTask={completeTask}
            onRequestExtension={requestExtension}
            onDeleteTask={deleteTask}
          />
        )}
        {tab === "shop" && (
          <ChildTabShop
            stars={data.stars}
            rewards={data.rewards || []}
            rewardPurchases={data.rewardPurchases || []}
            wishes={data.wishes || []}
            onBuy={buyReward}
            onAddWish={addWish}
            onDeleteWish={deleteWish}
          />
        )}
        {tab === "grades" && (
          <ChildTabGrades
            level={level}
            age={data.age}
            gradeRequests={data.gradeRequests}
            pendingGrades={pendingGrades}
            onSubmitGrade={submitGrade}
          />
        )}
        {tab === "friends" && (
          <ChildTabFriends />
        )}
        {tab === "profile" && (
          <ChildTabProfile
            name={data.name}
            avatar={data.avatar}
            age={data.age}
            stars={data.stars}
            totalStarsEarned={data.total_stars_earned ?? data.stars}
            level={level}
            levelEmoji={levelEmoji}
            approvedTasksCount={approvedTasks.length}
            achievementsCount={data.achievements.length}
          />
        )}
      </div>

      <ChildBottomNav
        tab={tab}
        onTabChange={setTab}
        pendingTasksCount={pendingTasks.length}
        doneTasksCount={doneTasks.length}
        pendingGradesCount={pendingGrades.length}
        friendRequestsCount={friendRequests}
        level={level}
      />
    </div>
  );
}