import { useState, useRef, useCallback } from "react";
import {
  getParentLevelInfo,
  getStreakBonus,
  advanceStreak,
  getTodayDateStr,
  PARENT_ACTION_XP,
  type ParentTab,
  type ParentAction,
  type StreakState,
} from "@/components/demo/types";

const INITIAL_STREAK: StreakState = {
  current: 4,
  lastActivityDate: getTodayDateStr(),
  claimedToday: false,
  longestStreak: 6,
};

export function useParentState(
  grantChildStars: (childId: number, taskId: number, taskStars: number) => void,
  getChild: (childId: number) => { tasks: { id: number; stars: number }[]; pendingConfirmTaskIds: number[] } | undefined,
) {
  const [parentTab, setParentTab] = useState<ParentTab>("tasks");
  const [parentXp, setParentXp] = useState(120);
  const [parentLevelUpLevel, setParentLevelUpLevel] = useState<number | null>(null);
  const [confirmedTasks, setConfirmedTasks] = useState<number[]>([1, 4]);
  const [purchasedPrizes, setPurchasedPrizes] = useState<number[]>([]);
  const prevParentLevelRef = useRef(getParentLevelInfo(120).level);

  const [streak, setStreak] = useState<StreakState>(INITIAL_STREAK);
  const [streakBonusModal, setStreakBonusModal] = useState<{ day: number; xp: number; points: number } | null>(null);

  const { totalPoints: parentPoints } = getParentLevelInfo(parentXp);

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

  const handleParentAction = useCallback((action: ParentAction) => {
    addParentXp(PARENT_ACTION_XP[action]);
    touchStreak();
  }, [addParentXp, touchStreak]);

  // Confirms a static demo task from PARENT_TASKS_LIST
  const handleConfirmTask = useCallback((taskId: number) => {
    if (confirmedTasks.includes(taskId)) return;
    setConfirmedTasks(prev => [...prev, taskId]);
    addParentXp(PARENT_ACTION_XP.task_confirm);
    touchStreak();
  }, [confirmedTasks, addParentXp, touchStreak]);

  // Confirms a real child task pending confirmation → grants stars
  const handleConfirmChildTask = useCallback((childId: number, taskId: number) => {
    const child = getChild(childId);
    if (!child || !child.pendingConfirmTaskIds.includes(taskId)) return;
    const task = child.tasks.find(t => t.id === taskId);
    if (!task) return;
    addParentXp(PARENT_ACTION_XP.task_confirm);
    touchStreak();
    grantChildStars(childId, taskId, task.stars);
  }, [getChild, addParentXp, touchStreak, grantChildStars]);

  const handleBuyPrize = useCallback((prizeId: number, cost: number) => {
    if (getParentLevelInfo(parentXp).totalPoints < cost || purchasedPrizes.includes(prizeId)) return;
    setPurchasedPrizes(prev => [...prev, prizeId]);
  }, [parentXp, purchasedPrizes]);

  const handleStreakClaim = useCallback(() => {
    setStreak(prev => {
      if (prev.claimedToday) return prev;
      const bonus = getStreakBonus(prev.current);
      setStreakBonusModal({ day: prev.current, xp: bonus.xp, points: bonus.points });
      addParentXp(bonus.xp);
      return { ...prev, claimedToday: true };
    });
  }, [addParentXp]);

  return {
    // state
    parentTab,
    parentXp,
    parentPoints,
    parentLevelUpLevel,
    confirmedTasks,
    purchasedPrizes,
    streak,
    streakBonusModal,
    // setters
    setParentTab,
    setParentLevelUpLevel,
    setStreakBonusModal,
    // handlers
    handleParentAction,
    handleConfirmTask,
    handleConfirmChildTask,
    handleBuyPrize,
    handleStreakClaim,
  };
}
