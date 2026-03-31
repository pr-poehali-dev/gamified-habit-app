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
  INITIAL_GRADE_REQUESTS,
  PARENT_ACTION_XP,
  type Mode, type ChildTab, type ParentTab, type ParentAction,
  type StreakState, type AchievementId, type Sticker, type ChildStats,
  type GradeRequest, type GradeValue,
} from "@/components/demo/types";
import { LevelUpModal, ParentLevelUpModal } from "@/components/demo/XpBar";
import { StreakBonusModal } from "@/components/demo/StreakCard";
import { NewAchievementModal } from "@/components/demo/AchievementBadge";
import ChildView from "@/components/demo/ChildView";
import ParentView from "@/components/demo/ParentView";

type CollectedSticker = { stickerId: string; count: number };

const INITIAL_STREAK: StreakState = {
  current: 4,
  lastActivityDate: getTodayDateStr(),
  claimedToday: false,
  longestStreak: 6,
};

export default function Index() {
  const [mode, setMode] = useState<Mode>("child");

  // Child state
  const [childTab, setChildTab] = useState<ChildTab>("tasks");
  const [completedTasks, setCompletedTasks] = useState<number[]>([1, 3]);
  const [purchasedItems, setPurchasedItems] = useState<number[]>([]);
  const [showStar, setShowStar] = useState(false);
  const [starCount, setStarCount] = useState(15);
  const [starsSpent, setStarsSpent] = useState(0);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevChildLevelRef = useRef(getLevelInfo(15).level);

  // Achievements & stickers
  const [achievements, setAchievements] = useState<AchievementId[]>(["first_task", "stars_10"]);
  const [newAchievements, setNewAchievements] = useState<AchievementId[]>([]);
  const [stickers, setStickers] = useState<CollectedSticker[]>([]);
  const [stickerPacks, setStickerPacks] = useState(2);
  const [avatarOverride, setAvatarOverride] = useState<string | undefined>(undefined);

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

  // Grade requests
  const [gradeRequests, setGradeRequests] = useState<GradeRequest[]>(INITIAL_GRADE_REQUESTS);

  const { totalPoints: parentPoints } = getParentLevelInfo(parentXp);

  // ── Achievement check ──
  const checkAndGrantAchievements = useCallback((stats: ChildStats, already: AchievementId[]) => {
    const newOnes = checkAchievements(stats, already);
    if (newOnes.length > 0) {
      setAchievements(prev => [...prev, ...newOnes]);
      setNewAchievements(newOnes);
      const totalAfter = already.length + newOnes.length;
      if (Math.floor(totalAfter / 3) > Math.floor(already.length / 3)) {
        setStickerPacks(prev => prev + 1);
      }
    }
  }, []);

  // ── Child handlers ──
  const handleTaskToggle = (taskId: number, taskStars: number) => {
    if (completedTasks.includes(taskId)) return;
    const newCompleted = [...completedTasks, taskId];
    setCompletedTasks(newCompleted);
    const newStars = starCount + taskStars;
    const newLevel = getLevelInfo(newStars).level;
    if (newLevel > prevChildLevelRef.current) {
      setLevelUpLevel(newLevel);
      setStickerPacks(prev => prev + 1);
    }
    prevChildLevelRef.current = newLevel;
    setStarCount(newStars);
    setShowStar(true);
    setTimeout(() => setShowStar(false), 1000);
    setAchievements(prev => {
      const stats: ChildStats = {
        tasksCompleted: newCompleted.length,
        totalStars: newStars,
        level: newLevel,
        starsSpent,
        rewardsBought: purchasedItems.length,
        streak: streak.current,
        fastTasksDone: 0,
      };
      checkAndGrantAchievements(stats, prev);
      return prev;
    });
  };

  const handleBuy = (itemId: number, cost: number) => {
    if (starCount < cost || purchasedItems.includes(itemId)) return;
    const newPurchased = [...purchasedItems, itemId];
    setPurchasedItems(newPurchased);
    const newStars = starCount - cost;
    const newSpent = starsSpent + cost;
    setStarCount(newStars);
    setStarsSpent(newSpent);
    setAchievements(prev => {
      const stats: ChildStats = {
        tasksCompleted: completedTasks.length,
        totalStars: newStars,
        level: getLevelInfo(newStars).level,
        starsSpent: newSpent,
        rewardsBought: newPurchased.length,
        streak: streak.current,
        fastTasksDone: 0,
      };
      checkAndGrantAchievements(stats, prev);
      return prev;
    });
  };

  // ── Sticker pack ──
  const handleOpenStickerPack = useCallback((): Sticker => {
    const sticker = rollSticker();
    setStickerPacks(prev => Math.max(0, prev - 1));
    setStickers(prev => {
      const existing = prev.find(c => c.stickerId === sticker.id);
      if (existing) return prev.map(c => c.stickerId === sticker.id ? { ...c, count: c.count + 1 } : c);
      return [...prev, { stickerId: sticker.id, count: 1 }];
    });
    if (sticker.avatarOverride) setAvatarOverride(sticker.avatarOverride);
    return sticker;
  }, []);

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

  const touchStreak = useCallback(() => {
    setStreak(prev => advanceStreak(prev));
  }, []);

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
    const { totalPoints } = getParentLevelInfo(parentXp);
    if (totalPoints < cost || purchasedPrizes.includes(prizeId)) return;
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

  // ── Grade handlers ──
  const handleSubmitGrade = (subject: string, grade: GradeValue, date: string) => {
    const newRequest: GradeRequest = {
      id: `gr_${Date.now()}`,
      subject,
      grade,
      date,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setGradeRequests(prev => [newRequest, ...prev]);
  };

  const handleApproveGrade = useCallback((id: string) => {
    setGradeRequests(prev =>
      prev.map(r => {
        if (r.id !== id || r.status !== "pending") return r;
        const stars = GRADE_STARS[r.grade];
        // Award stars to child
        setStarCount(s => s + stars);
        prevChildLevelRef.current = getLevelInfo(starCount + stars).level;
        addParentXp(PARENT_ACTION_XP.task_confirm);
        touchStreak();
        return { ...r, status: "approved" as const, starsAwarded: stars };
      })
    );
  }, [starCount, addParentXp, touchStreak]);

  const handleRejectGrade = useCallback((id: string) => {
    setGradeRequests(prev =>
      prev.map(r => r.id === id && r.status === "pending" ? { ...r, status: "rejected" as const } : r)
    );
  }, []);

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        mode === "child"
          ? "bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]"
          : "bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF]"
      }`}
      style={{ fontFamily: mode === "child" ? "Nunito, sans-serif" : "Golos Text, sans-serif" }}
    >
      {levelUpLevel !== null && (
        <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />
      )}
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
        <NewAchievementModal
          ids={newAchievements}
          onClose={() => setNewAchievements([])}
        />
      )}
      {showStar && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div className="text-8xl animate-star-pop">⭐</div>
        </div>
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

      {mode === "child" && (
        <ChildView
          childTab={childTab}
          setChildTab={setChildTab}
          starCount={starCount}
          completedTasks={completedTasks}
          purchasedItems={purchasedItems}
          achievements={achievements}
          stickers={stickers}
          stickerPacks={stickerPacks}
          avatarOverride={avatarOverride}
          gradeRequests={gradeRequests}
          handleTaskToggle={handleTaskToggle}
          handleBuy={handleBuy}
          onOpenStickerPack={handleOpenStickerPack}
          onSubmitGrade={handleSubmitGrade}
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
          gradeRequests={gradeRequests}
          onAction={handleParentAction}
          onConfirmTask={handleConfirmTask}
          onBuyPrize={handleBuyPrize}
          onStreakClaim={handleStreakClaim}
          onApproveGrade={handleApproveGrade}
          onRejectGrade={handleRejectGrade}
        />
      )}
    </div>
  );
}