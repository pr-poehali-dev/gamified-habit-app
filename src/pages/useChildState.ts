import { useState, useRef, useCallback } from "react";
import {
  getLevelInfo,
  checkAchievements,
  rollSticker,
  GRADE_STARS,
  INITIAL_CHILDREN,
  makeTask,
  type ChildTab,
  type AchievementId,
  type Sticker,
  type ChildStats,
  type GradeRequest,
  type GradeValue,
  type ChildProfile,
  type PhotoProof,
  type Task,
} from "@/components/demo/types";

export type GradeNotif = {
  id: string;
  type: "approved" | "rejected";
  subject: string;
  stars?: number;
  childName: string;
};

export function useChildState(streakCurrent: number) {
  const [children, setChildren] = useState<ChildProfile[]>(INITIAL_CHILDREN);
  const [activeChildId, setActiveChildId] = useState<number>(INITIAL_CHILDREN[0].id);

  const activeChild = children.find(c => c.id === activeChildId) ?? children[0];

  const updateChild = useCallback((id: number, updater: (p: ChildProfile) => ChildProfile) => {
    setChildren(prev => prev.map(c => c.id === id ? updater(c) : c));
  }, []);

  // Per-child tab state
  const [childTabs, setChildTabs] = useState<Record<number, ChildTab>>({});
  const childTab = childTabs[activeChildId] ?? "tasks";
  const setChildTab = (tab: ChildTab) =>
    setChildTabs(prev => ({ ...prev, [activeChildId]: tab }));

  // Modals / UI state
  const [showStar, setShowStar] = useState(false);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevLevelRef = useRef<Record<number, number>>({
    [INITIAL_CHILDREN[0].id]: getLevelInfo(INITIAL_CHILDREN[0].stars).level,
    [INITIAL_CHILDREN[1].id]: getLevelInfo(INITIAL_CHILDREN[1].stars).level,
  });

  const [newAchievements, setNewAchievements] = useState<AchievementId[]>([]);

  // Grade notifications
  const [gradeNotifParent, setGradeNotifParent] = useState<{ subject: string; grade: number; childName: string } | null>(null);
  const [gradeNotifChild, setGradeNotifChild] = useState<GradeNotif | null>(null);

  // ── Achievement check ──
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

  // ── Grant stars ──
  const grantStars = useCallback((childId: number, taskId: number, taskStars: number) => {
    updateChild(childId, p => {
      const newStars = p.stars + taskStars;
      const newLevel = getLevelInfo(newStars).level;
      const prevLevel = prevLevelRef.current[childId] ?? 1;
      const leveledUp = newLevel > prevLevel;
      if (leveledUp) {
        setLevelUpLevel(newLevel);
        prevLevelRef.current[childId] = newLevel;
      }
      return {
        ...p,
        stars: newStars,
        completedTaskIds: [...p.completedTaskIds, taskId],
        pendingConfirmTaskIds: p.pendingConfirmTaskIds.filter(id => id !== taskId),
        stickerPacks: leveledUp ? p.stickerPacks + 1 : p.stickerPacks,
      };
    });
    setShowStar(true);
    setTimeout(() => setShowStar(false), 1000);
    setChildren(prev => {
      const child = prev.find(c => c.id === childId);
      if (!child) return prev;
      const newStars = child.stars + taskStars;
      const newLevel = getLevelInfo(newStars).level;
      const newCompleted = [...child.completedTaskIds, taskId];
      checkAndGrantAchievements(childId, {
        tasksCompleted: newCompleted.length,
        totalStars: newStars,
        level: newLevel,
        starsSpent: child.starsSpent,
        rewardsBought: child.purchasedItemIds.length,
        streak: streakCurrent,
        fastTasksDone: 0,
      }, child.achievements);
      return prev;
    });
  }, [streakCurrent, updateChild, checkAndGrantAchievements]);

  // ── Task toggle ──
  const handleTaskToggle = useCallback((taskId: number, taskStars: number) => {
    const child = children.find(c => c.id === activeChildId);
    if (!child) return;
    if (child.completedTaskIds.includes(taskId)) return;
    if (child.pendingConfirmTaskIds.includes(taskId)) return;

    const task = child.tasks.find(t => t.id === taskId);
    if (task?.requireConfirm) {
      updateChild(activeChildId, p => ({
        ...p,
        pendingConfirmTaskIds: [...p.pendingConfirmTaskIds, taskId],
      }));
      return;
    }
    grantStars(activeChildId, taskId, taskStars);
  }, [children, activeChildId, updateChild, grantStars]);

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
      streak: streakCurrent,
      fastTasksDone: 0,
    }, child.achievements);
  }, [children, activeChildId, streakCurrent, updateChild, checkAndGrantAchievements]);

  // ── Sticker pack ──
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

  // ── Photo proof ──
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

  const handleRejectConfirmTask = useCallback((childId: number, taskId: number) => {
    updateChild(childId, p => ({
      ...p,
      pendingConfirmTaskIds: p.pendingConfirmTaskIds.filter(id => id !== taskId),
    }));
  }, [updateChild]);

  // ── Grade handlers ──
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

  // ── Add task ──
  const handleAddTask = useCallback((taskData: Omit<Task, "id">, childId: number) => {
    const base = makeTask(taskData.title, taskData.stars, taskData.emoji);
    const newTask: Task = { ...base, requirePhoto: taskData.requirePhoto, requireConfirm: taskData.requireConfirm };
    updateChild(childId, p => ({ ...p, tasks: [...p.tasks, newTask] }));
  }, [updateChild]);

  return {
    // state
    children,
    activeChildId,
    activeChild,
    childTab,
    showStar,
    levelUpLevel,
    newAchievements,
    gradeNotifParent,
    gradeNotifChild,
    // setters
    setActiveChildId,
    setChildTab,
    setLevelUpLevel,
    setNewAchievements,
    setGradeNotifParent,
    setGradeNotifChild,
    // handlers
    grantStars,
    handleTaskToggle,
    handleBuy,
    handleOpenStickerPack,
    handleAttachPhoto,
    handleApprovePhoto,
    handleRejectPhoto,
    handleRejectConfirmTask,
    handleSubmitGrade,
    handleApproveGrade,
    handleRejectGrade,
    handleAddTask,
  };
}
