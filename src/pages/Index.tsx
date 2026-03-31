import { useState, useRef, useCallback } from "react";
import { getLevelInfo, type Mode, type ChildTab, type ParentTab } from "@/components/demo/types";
import { LevelUpModal } from "@/components/demo/XpBar";
import ChildView from "@/components/demo/ChildView";
import ParentView from "@/components/demo/ParentView";

export default function Index() {
  const [mode, setMode] = useState<Mode>("child");
  const [childTab, setChildTab] = useState<ChildTab>("tasks");
  const [parentTab, setParentTab] = useState<ParentTab>("tasks");
  const [completedTasks, setCompletedTasks] = useState<number[]>([1, 3]);
  const [purchasedItems, setPurchasedItems] = useState<number[]>([]);
  const [showStar, setShowStar] = useState(false);
  const [starCount, setStarCount] = useState(15);
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const prevLevelRef = useRef(getLevelInfo(15).level);

  const updateStars = useCallback((newStars: number) => {
    const newLevel = getLevelInfo(newStars).level;
    if (newLevel > prevLevelRef.current) {
      setLevelUpLevel(newLevel);
    }
    prevLevelRef.current = newLevel;
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
        />
      )}
    </div>
  );
}
