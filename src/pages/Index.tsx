import { useState, useRef, useCallback } from "react";
import {
  getLevelInfo,
  getParentLevelInfo,
  getStreakBonus,
  advanceStreak,
  getTodayDateStr,
  checkAchievements,
  rollSticker,
  GRADE_STARS,
  INITIAL_CHILDREN,
  PARENT_ACTION_XP,
  type Mode, type ChildTab, type ParentTab, type ParentAction,
  type StreakState, type AchievementId, type Sticker, type ChildStats,
  type GradeRequest, type GradeValue, type ChildProfile, type PhotoProof,
} from "@/components/demo/types";
import { LevelUpModal, ParentLevelUpModal } from "@/components/demo/XpBar";
import { StreakBonusModal } from "@/components/demo/StreakCard";
import { NewAchievementModal } from "@/components/demo/AchievementBadge";
import { GradeToast } from "@/components/demo/GradeExchange";
import { ChildProfileSwitcher } from "@/components/demo/ChildProfileSwitcher";
import ChildView from "@/components/demo/ChildView";
import ParentView from "@/components/demo/ParentView";

const INITIAL_STREAK: StreakState = {
  current: 4,
  lastActivityDate: getTodayDateStr(),
  claimedToday: false,
  longestStreak: 6,
};

export default function Index() {
  const [mode, setMode] = useState<Mode>("child");

  // ── Multi-child profiles ──
  const [children, setChildren] = useState<ChildProfile[]>(INITIAL_CHILDREN);
  const [activeChildId, setActiveChildId] = useState<number>(INITIAL_CHILDREN[0].id);

  const activeChild = children.find(c => c.id === activeChildId) ?? children[0];

  const updateChild = useCallback((id: number, updater: (p: ChildProfile) => ChildProfile) => {
    setChildren(prev => prev.map(c => c.id === id ? updater(c) : c));
  }, []);

  // Child-scoped tab state (per child)
  const [childTabs, setChildTabs] = useState<Record<number, ChildTab>>({});
  const childTab = childTabs[activeChildId] ?? "tasks";
  const setChildTab = (tab: ChildTab) =>
    setChildTabs(prev => ({ ...prev, [activeChildId]: tab }));

  // Modals
  const [showStar, setShowStar] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevLevelRef = useRef<Record<number, number>>({
    [INITIAL_CHILDREN[0].id]: getLevelInfo(INITIAL_CHILDREN[0].stars).level,
    [INITIAL_CHILDREN[1].id]: getLevelInfo(INITIAL_CHILDREN[1].stars).level,
  });

  const [newAchievements, setNewAchievements] = useState<AchievementId[]>([]);

  // Parent state
  const [parentTab, setParentTab] = useState<ParentTab>("tasks");
  const [parentXp, setParentXp] = useState(120);
  const [parentLevelUpLevel, setParentLevelUpLevel] = useState<number | null>(null);
  const [confirmedTasks, setConfirmedTasks] = useState<number[]>([1, 4]);
  const [purchasedPrizes, setPurchasedPrizes] = useState<number[]>([]);
  const prevParentLevelRef = useRef(getParentLevelInfo(120).level);

  // Streak
  const [streak, setStreak] = useState<StreakState>(INITIAL_STREAK);
  const [streakBonusModal, setStreakBonusModal] = useState<{ day: number; xp: number; points: number } | null>(null);

  // Grade notifications
  type GradeNotif = { id: string; type: "approved" | "rejected"; subject: string; stars?: number; childName: string };
  const [gradeNotifParent, setGradeNotifParent] = useState<{ subject: string; grade: number; childName: string } | null>(null);
  const [gradeNotifChild, setGradeNotifChild] = useState<GradeNotif | null>(null);

  const { totalPoints: parentPoints } = getParentLevelInfo(parentXp);

  // ── Achievement check for a specific child ──
  const checkAndGrantAchievements = useCallback((
    childId: number, stats: ChildStats, already: AchievementId[]
  ) => {
    const newOnes = checkAchievements(stats, already);
    if (newOnes.length === 0) return;
    updateChild(childId, p => ({
      ...p,
      achievements: [...p.achievements, ...newOnes],
      stickerPacks: Math.floor((p.achievements.length + newOnes.length) / 3) > Math.floor(p.achievements.length / 3)
        ? p.stickerPacks + 1
        : p.stickerPacks,
    }));
    setNewAchievements(newOnes);
  }, [updateChild]);

  // ── Child task toggle ──
  const handleTaskToggle = useCallback((taskId: number, taskStars: number) => {
    const child = children.find(c => c.id === activeChildId);
    if (!child || child.completedTaskIds.includes(taskId)) return;

    const newCompleted = [...child.completedTaskIds, taskId];
    const newStars = child.stars + taskStars;
    const newLevel = getLevelInfo(newStars).level;
    const prevLevel = prevLevelRef.current[activeChildId] ?? 1;

    if (newLevel > prevLevel) {
      setLevelUpLevel(newLevel);
      updateChild(activeChildId, p => ({ ...p, stickerPacks: p.stickerPacks + 1 }));
    }
    prevLevelRef.current[activeChildId] = newLevel;

    updateChild(activeChildId, p => ({ ...p, stars: newStars, completedTaskIds: newCompleted }));
    setShowStar(true);
    setTimeout(() => setShowStar(false), 1000);

    // Check achievements
    checkAndGrantAchievements(activeChildId, {
      tasksCompleted: newCompleted.length,
      totalStars: newStars,
      level: newLevel,
      starsSpent: child.starsSpent,
      rewardsBought: child.purchasedItemIds.length,
      streak: streak.current,
      fastTasksDone: 0,
    }, child.achievements);
  }, [children, activeChildId, streak.current, updateChild, checkAndGrantAchievements]);

  // ── Buy reward ──
  const handleBuy = useCallback((itemId: number, cost: number) => {
    const child = children.find(c => c.id === activeChildId);
    if (!child || child.stars < cost || child.purchasedItemIds.includes(itemId)) return;

    const newStars = child.stars - cost;
    const newSpent = child.starsSpent + cost;
    const newPurchased = [...child.purchasedItemIds, itemId];
    updateChild(activeChildId, p => ({
      ...p, stars: newStars, starsSpent: newSpent, purchasedItemIds: newPurchased,
    }));

    checkAndGrantAchievements(activeChildId, {
      tasksCompleted: child.completedTaskIds.length,
      totalStars: newStars,
      level: getLevelInfo(newStars).level,
      starsSpent: newSpent,
      rewardsBought: newPurchased.length,
      streak: streak.current,
      fastTasksDone: 0,
    }, child.achievements);
  }, [children, activeChildId, streak.current, updateChild, checkAndGrantAchievements]);

  // ── Open sticker pack ──
  const handleOpenStickerPack = useCallback((): Sticker => {
    const sticker = rollSticker();
    updateChild(activeChildId, p => {
      const existing = p.stickers.find(s => s.stickerId === sticker.id);
      const newStickers = existing
        ? p.stickers.map(s => s.stickerId === sticker.id ? { ...s, count: s.count + 1 } : s)
        : [...p.stickers, { stickerId: sticker.id, count: 1 }];
      return {
        ...p,
        stickerPacks: Math.max(0, p.stickerPacks - 1),
        stickers: newStickers,
        avatarOverride: sticker.avatarOverride ?? p.avatarOverride,
      };
    });
    return sticker;
  }, [activeChildId, updateChild]);

  // ── Photo proof handlers ──
  const handleAttachPhoto = useCallback((taskId: number, dataUrl: string) => {
    updateChild(activeChildId, p => {
      const existing = p.photoProofs.find(pp => pp.taskId === taskId);
      const newProof: PhotoProof = {
        taskId,
        dataUrl,
        uploadedAt: new Date().toISOString(),
        status: "pending_review",
      };
      return {
        ...p,
        photoProofs: existing
          ? p.photoProofs.map(pp => pp.taskId === taskId ? newProof : pp)
          : [...p.photoProofs, newProof],
      };
    });
  }, [activeChildId, updateChild]);

  const handleApprovePhoto = useCallback((childId: number, taskId: number) => {
    updateChild(childId, p => ({
      ...p,
      photoProofs: p.photoProofs.map(pp =>
        pp.taskId === taskId ? { ...pp, status: "approved" as const } : pp
      ),
    }));
  }, [updateChild]);

  const handleRejectPhoto = useCallback((childId: number, taskId: number) => {
    updateChild(childId, p => ({
      ...p,
      photoProofs: p.photoProofs.map(pp =>
        pp.taskId === taskId ? { ...pp, status: "rejected" as const } : pp
      ),
    }));
  }, [updateChild]);

  // ── Parent XP ──
  const addParentXp = useCallback((xp: number) => {
    setParentXp(prev => {
      const next = prev + xp;
      const newLevel = getParentLevelInfo(next).level;
      if (newLevel > prevParentLevelRef.current) setParentLevelUpLevel(newLevel);
      prevParentLevelRef.current = newLevel;
      return next;
    });
  }, []);

  const touchStreak = useCallback(() => setStreak(prev => advanceStreak(prev)), []);

  const handleParentAction = (action: ParentAction) => {
    addParentXp(PARENT_ACTION_XP[action]);
    touchStreak();
  };

  const handleConfirmTask = (taskId: number) => {
    if (confirmedTasks.includes(taskId)) return;
    setConfirmedTasks(prev => [...prev, taskId]);
    addParentXp(PARENT_ACTION_XP.task_confirm);
    touchStreak();
  };

  const handleBuyPrize = (prizeId: number, cost: number) => {
    if (getParentLevelInfo(parentXp).totalPoints < cost || purchasedPrizes.includes(prizeId)) return;
    setPurchasedPrizes(prev => [...prev, prizeId]);
  };

  const handleStreakClaim = useCallback(() => {
    setStreak(prev => {
      if (prev.claimedToday) return prev;
      const bonus = getStreakBonus(prev.current);
      setStreakBonusModal({ day: prev.current, xp: bonus.xp, points: bonus.points });
      addParentXp(bonus.xp);
      return { ...prev, claimedToday: true };
    });
  }, [addParentXp]);

  // ── Grade handlers (per child) ──
  const handleSubmitGrade = useCallback((childId: number, subject: string, grade: GradeValue, date: string) => {
    const req: GradeRequest = {
      id: `gr_${Date.now()}`,
      subject, grade, date,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    updateChild(childId, p => ({ ...p, gradeRequests: [req, ...p.gradeRequests] }));
    const child = children.find(c => c.id === childId);
    setGradeNotifParent({ subject, grade, childName: child?.name ?? "" });
  }, [children, updateChild]);

  const handleApproveGrade = useCallback((childId: number, reqId: string) => {
    const child = children.find(c => c.id === childId);
    const req = child?.gradeRequests.find(r => r.id === reqId);
    if (!req || req.status !== "pending") return;
    const stars = GRADE_STARS[req.grade];
    updateChild(childId, p => ({
      ...p,
      stars: p.stars + stars,
      gradeRequests: p.gradeRequests.map(r =>
        r.id === reqId ? { ...r, status: "approved" as const, starsAwarded: stars } : r
      ),
    }));
    setGradeNotifChild({ id: reqId, type: "approved", subject: req.subject, stars, childName: child?.name ?? "" });
  }, [children, updateChild]);

  const handleRejectGrade = useCallback((childId: number, reqId: string) => {
    const child = children.find(c => c.id === childId);
    const req = child?.gradeRequests.find(r => r.id === reqId);
    if (!req) return;
    updateChild(childId, p => ({
      ...p,
      gradeRequests: p.gradeRequests.map(r =>
        r.id === reqId ? { ...r, status: "rejected" as const } : r
      ),
    }));
    setGradeNotifChild({ id: reqId, type: "rejected", subject: req.subject, childName: child?.name ?? "" });
  }, [children, updateChild]);

  // All pending grade requests across children (for parent view)
  const allGradeRequests: (GradeRequest & { childId: number; childName: string })[] = children.flatMap(c =>
    c.gradeRequests.map(r => ({ ...r, childId: c.id, childName: c.name }))
  );

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        mode === "child"
          ? "bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]"
          : "bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF]"
      }`}
      style={{ fontFamily: mode === "child" ? "Nunito, sans-serif" : "Golos Text, sans-serif" }}
    >
      {levelUpLevel !== null && <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />}
      {parentLevelUpLevel !== null && (
        <ParentLevelUpModal
          level={parentLevelUpLevel}
          points={getParentLevelInfo(parentXp).totalPoints}
          onClose={() => setParentLevelUpLevel(null)}
        />
      )}
      {streakBonusModal !== null && (
        <StreakBonusModal
          day={streakBonusModal.day}
          xp={streakBonusModal.xp}
          points={streakBonusModal.points}
          onClose={() => setStreakBonusModal(null)}
        />
      )}
      {newAchievements.length > 0 && (
        <NewAchievementModal ids={newAchievements} onClose={() => setNewAchievements([])} />
      )}
      {showStar && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div className="text-8xl animate-star-pop">⭐</div>
        </div>
      )}
      {gradeNotifParent && (
        <GradeToast
          emoji="📝"
          title={`Новая оценка от ${gradeNotifParent.childName}`}
          subtitle={`${gradeNotifParent.subject} · ${gradeNotifParent.grade} балл — ожидает подтверждения`}
          color="from-[#6B7BFF] to-[#9B6BFF]"
          onClose={() => setGradeNotifParent(null)}
        />
      )}
      {gradeNotifChild && (
        <GradeToast
          emoji={gradeNotifChild.type === "approved" ? "🌟" : "😔"}
          title={gradeNotifChild.type === "approved" ? `+${gradeNotifChild.stars} звёзд начислено!` : "Оценка отклонена"}
          subtitle={gradeNotifChild.type === "approved"
            ? `${gradeNotifChild.subject} · родитель подтвердил обмен`
            : `${gradeNotifChild.subject} · обратись к родителю`}
          color={gradeNotifChild.type === "approved" ? "from-green-400 to-emerald-500" : "from-orange-400 to-red-500"}
          onClose={() => setGradeNotifChild(null)}
        />
      )}

      {/* Mode switcher */}
      <div className="flex justify-center pt-5 px-4">
        <div
          className="flex rounded-2xl p-1 gap-1 shadow-lg"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)" }}
        >
          <button
            onClick={() => setMode("child")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              mode === "child"
                ? "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white shadow-md scale-105"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            👧 Ребёнок
          </button>
          <button
            onClick={() => setMode("parent")}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
              mode === "parent"
                ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-md scale-105"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            👨 Родитель
          </button>
        </div>
      </div>

      {/* Child profile switcher */}
      {mode === "child" && (
        <ChildProfileSwitcher
          profiles={children}
          activeId={activeChildId}
          onSwitch={id => { setActiveChildId(id); }}
        />
      )}

      {mode === "child" && (
        <ChildView
          key={activeChildId}
          childTab={childTab}
          setChildTab={setChildTab}
          profile={activeChild}
          handleTaskToggle={handleTaskToggle}
          handleBuy={handleBuy}
          onOpenStickerPack={handleOpenStickerPack}
          onSubmitGrade={(subject, grade, date) => handleSubmitGrade(activeChildId, subject, grade, date)}
          onAttachPhoto={handleAttachPhoto}
        />
      )}

      {mode === "parent" && (
        <ParentView
          parentTab={parentTab}
          setParentTab={setParentTab}
          parentXp={parentXp}
          parentPoints={parentPoints}
          streak={streak}
          confirmedTasks={confirmedTasks}
          purchasedPrizes={purchasedPrizes}
          gradeRequests={allGradeRequests}
          photoProofs={children.flatMap(c =>
            c.photoProofs.map(p => ({
              ...p,
              childId: c.id,
              childName: c.name,
              taskTitle: c.tasks.find(t => t.id === p.taskId)?.title ?? "",
            }))
          )}
          onAction={handleParentAction}
          onConfirmTask={handleConfirmTask}
          onBuyPrize={handleBuyPrize}
          onStreakClaim={handleStreakClaim}
          onApproveGrade={(id) => {
            const req = allGradeRequests.find(r => r.id === id);
            if (req) handleApproveGrade(req.childId, id);
          }}
          onRejectGrade={(id) => {
            const req = allGradeRequests.find(r => r.id === id);
            if (req) handleRejectGrade(req.childId, id);
          }}
          onApprovePhoto={handleApprovePhoto}
          onRejectPhoto={handleRejectPhoto}
        />
      )}
    </div>
  );
}