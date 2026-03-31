import { useState, useRef, useCallback } from "react";
import {
  getLevelInfo,
  getParentLevelInfo,
  PARENT_ACTION_XP,
  type Mode, type ChildTab, type ParentTab, type ParentAction,
} from "@/components/demo/types";
import { LevelUpModal, ParentLevelUpModal } from "@/components/demo/XpBar";
import ChildView from "@/components/demo/ChildView";
import ParentView from "@/components/demo/ParentView";

export default function Index() {
  const [mode, setMode] = useState<Mode>("child");

  // Child state
  const [childTab, setChildTab] = useState<ChildTab>("tasks");
  const [completedTasks, setCompletedTasks] = useState<number[]>([1, 3]);
  const [purchasedItems, setPurchasedItems] = useState<number[]>([]);
  const [showStar, setShowStar] = useState(false);
  const [starCount, setStarCount] = useState(15);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevChildLevelRef = useRef(getLevelInfo(15).level);

  // Parent state
  const [parentTab, setParentTab] = useState<ParentTab>("tasks");
  const [parentXp, setParentXp] = useState(120);
  const [parentLevelUpLevel, setParentLevelUpLevel] = useState<number | null>(null);
  const [confirmedTasks, setConfirmedTasks] = useState<number[]>([1, 4]);
  const [purchasedPrizes, setPurchasedPrizes] = useState<number[]>([]);
  const prevParentLevelRef = useRef(getParentLevelInfo(120).level);

  const { totalPoints: parentPoints } = getParentLevelInfo(parentXp);

  // ── Child handlers ──
  const updateStars = useCallback((newStars: number) => {
    const newLevel = getLevelInfo(newStars).level;
    if (newLevel > prevChildLevelRef.current) setLevelUpLevel(newLevel);
    prevChildLevelRef.current = newLevel;
    setStarCount(newStars);
  }, []);

  const handleTaskToggle = (taskId: number, taskStars: number) => {
    if (completedTasks.includes(taskId)) return;
    setCompletedTasks(prev => [...prev, taskId]);
    updateStars(starCount + taskStars);
    setShowStar(true);
    setTimeout(() => setShowStar(false), 1000);
  };

  const handleBuy = (itemId: number, cost: number) => {
    if (starCount < cost || purchasedItems.includes(itemId)) return;
    setPurchasedItems(prev => [...prev, itemId]);
    updateStars(starCount - cost);
  };

  // ── Parent handlers ──
  const addParentXp = useCallback((xp: number) => {
    setParentXp(prev => {
      const next = prev + xp;
      const newLevel = getParentLevelInfo(next).level;
      if (newLevel > prevParentLevelRef.current) setParentLevelUpLevel(newLevel);
      prevParentLevelRef.current = newLevel;
      return next;
    });
  }, []);

  const handleParentAction = (action: ParentAction) => {
    addParentXp(PARENT_ACTION_XP[action]);
  };

  const handleConfirmTask = (taskId: number) => {
    if (confirmedTasks.includes(taskId)) return;
    setConfirmedTasks(prev => [...prev, taskId]);
    addParentXp(PARENT_ACTION_XP.task_confirm);
  };

  const handleBuyPrize = (prizeId: number, cost: number) => {
    const { totalPoints } = getParentLevelInfo(parentXp);
    if (totalPoints < cost || purchasedPrizes.includes(prizeId)) return;
    setPurchasedPrizes(prev => [...prev, prizeId]);
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        mode === "child"
          ? "bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]"
          : "bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF]"
      }`}
      style={{ fontFamily: mode === "child" ? "Nunito, sans-serif" : "Golos Text, sans-serif" }}
    >
      {/* Child level-up */}
      {levelUpLevel !== null && (
        <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />
      )}

      {/* Parent level-up */}
      {parentLevelUpLevel !== null && (
        <ParentLevelUpModal
          level={parentLevelUpLevel}
          points={getParentLevelInfo(parentXp).totalPoints}
          onClose={() => setParentLevelUpLevel(null)}
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
          handleTaskToggle={handleTaskToggle}
          handleBuy={handleBuy}
        />
      )}

      {mode === "parent" && (
        <ParentView
          parentTab={parentTab}
          setParentTab={setParentTab}
          parentXp={parentXp}
          parentPoints={parentPoints}
          confirmedTasks={confirmedTasks}
          purchasedPrizes={purchasedPrizes}
          onAction={handleParentAction}
          onConfirmTask={handleConfirmTask}
          onBuyPrize={handleBuyPrize}
        />
      )}
    </div>
  );
}
