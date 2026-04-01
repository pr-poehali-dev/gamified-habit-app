import { useState, useEffect, useCallback, useRef } from "react";
import { tg } from "@/components/miniapp/types";
import { apiCall } from "@/components/miniapp/useApi";
import { getLevelInfo, getLevelEmoji, getSubjectsByAge, type GradeValue, type AchievementId } from "@/lib/gameTypes";
import { XpBar, LevelUpModal } from "@/components/ui/XpBar";
import { Loading, ErrorScreen } from "@/components/child/ChildScreens";
import { ChildTabTasks } from "@/components/child/ChildTabTasks";
import { ChildTabShop, ChildTabGrades, ChildTabAchievements, ChildTabProfile } from "@/components/child/ChildTabContent";
import { ChildBottomNav, type ChildTab } from "@/components/child/ChildBottomNav";
import { ChildOnboarding } from "@/components/child/ChildOnboarding";
import { ChildConnectScreen } from "@/components/child/ChildConnectScreen";

// ─── Types ────────────────────────────────────────────────────────────────────

type Reward = { id: number; title: string; cost: number; emoji: string; childId: number | null; quantity: number };

type ChildData = {
  role: "child";
  id: number; name: string; stars: number; age: number;
  avatar: string; telegram_id: number; parent_id: number;
  level: number; xpInLevel: number;
  achievements: AchievementId[];
  stickers: { stickerId: string; count: number }[];
  gradeRequests: GradeReq[];
  tasks: Task[];
  rewards: Reward[];
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
      const lvl = getLevelInfo(d.stars).level;
      if (!silent) prevLevelRef.current = lvl;
      // Запоминаем, что ребёнок был успешно подключён
      localStorage.setItem("child_was_connected", "1");
      setData(d);
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
        showToast("❌ Ошибка загрузки фото: " + String(uploadRes.error || "Попробуй снова"));
        return;
      }
      body.photo_url = uploadRes.photo_url;
    }

    const res = await apiCall("child/complete", body);
    if (res.ok) {
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

  const buyReward = useCallback(async (rewardId: number) => {
    tg()?.HapticFeedback?.impactOccurred("medium");
    const res = await apiCall("child/reward/buy", { reward_id: rewardId });
    if (res.ok) {
      tg()?.HapticFeedback?.notificationOccurred("success");
      showToast("🎁 Награда куплена! Родитель получил уведомление.");
      load(false);
    } else {
      showToast("❌ " + String(res.error || "Не хватает звёзд"));
    }
  }, []);

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
        onDone={() => { localStorage.setItem("child_onboarding_done", "1"); setOnboardingDone(true); }}
      />
    );
  }

  const { level } = getLevelInfo(data.stars);
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
          <XpBar stars={data.stars} />
        </div>
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
          />
        )}
        {tab === "shop" && (
          <ChildTabShop
            stars={data.stars}
            rewards={data.rewards || []}
            onBuy={buyReward}
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
        {tab === "achievements" && (
          <ChildTabAchievements achievements={data.achievements} />
        )}
        {tab === "profile" && (
          <ChildTabProfile
            name={data.name}
            avatar={data.avatar}
            age={data.age}
            stars={data.stars}
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
        level={level}
      />
    </div>
  );
}