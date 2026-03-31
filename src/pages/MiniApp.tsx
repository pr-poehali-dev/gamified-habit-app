import { useState, useEffect } from "react";
import { tg } from "@/components/miniapp/types";
import { useChildState } from "@/pages/useChildState";
import { useParentState } from "@/pages/useParentState";
import { AppModals } from "@/pages/AppModals";
import ChildView from "@/components/demo/ChildView";
import ParentView from "@/components/demo/ParentView";
import { ChildProfileSwitcher } from "@/components/demo/ChildProfileSwitcher";
import { type GradeRequest } from "@/components/demo/types";
import { type PendingConfirmTask } from "@/components/demo/ParentTasksTab";

type Role = "child" | "parent" | null;

export default function MiniApp() {
  const [role, setRole] = useState<Role>(null);
  const [childTab, setChildTabLocal] = useState<"tasks" | "stars" | "shop" | "grades" | "achievements" | "stickers" | "profile">("tasks");

  useEffect(() => {
    const webapp = tg();
    if (webapp) {
      webapp.ready();
      webapp.expand();
    }
  }, []);

  // ── State from web hooks ──
  const child = useChildState(0);
  const parent = useParentState(
    child.grantStars,
    (childId) => child.children.find(c => c.id === childId),
  );

  const allGradeRequests: (GradeRequest & { childId: number; childName: string })[] =
    child.children.flatMap(c =>
      c.gradeRequests.map(r => ({ ...r, childId: c.id, childName: c.name }))
    );

  const childNames = child.children.map(c => ({ id: c.id, name: c.name }));

  const allPendingConfirmTasks: PendingConfirmTask[] = child.children.flatMap(c =>
    c.pendingConfirmTaskIds.map(taskId => {
      const task = c.tasks.find(t => t.id === taskId);
      return task ? {
        taskId, childId: c.id, childName: c.name, childAvatar: c.avatar,
        taskTitle: task.title, taskEmoji: task.emoji, taskStars: task.stars,
      } : null;
    }).filter(Boolean) as PendingConfirmTask[]
  );

  const allPhotoProofs = child.children.flatMap(c =>
    c.photoProofs.map(p => ({
      ...p, childId: c.id, childName: c.name,
      taskTitle: c.tasks.find(t => t.id === p.taskId)?.title ?? "",
    }))
  );

  // ── Role picker ──
  if (!role) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: "linear-gradient(135deg, #667eea 0%, #9B6BFF 100%)" }}
      >
        <div className="text-6xl mb-4">⭐</div>
        <h1 className="text-white text-2xl font-black mb-1">СтарКидс</h1>
        <p className="text-white/70 text-sm mb-10">Кто ты сегодня?</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => { tg()?.HapticFeedback?.impactOccurred("medium"); setRole("child"); }}
            className="bg-white rounded-2xl py-4 px-6 flex items-center gap-4 shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-4xl">👧</span>
            <div className="text-left">
              <p className="font-black text-[#2D1B69] text-lg">Я ребёнок</p>
              <p className="text-gray-400 text-sm">Задачи, звёзды, награды</p>
            </div>
          </button>
          <button
            onClick={() => { tg()?.HapticFeedback?.impactOccurred("medium"); setRole("parent"); }}
            className="bg-white rounded-2xl py-4 px-6 flex items-center gap-4 shadow-lg active:scale-95 transition-transform"
          >
            <span className="text-4xl">👨</span>
            <div className="text-left">
              <p className="font-black text-[#1E1B4B] text-lg">Я родитель</p>
              <p className="text-gray-400 text-sm">Управление, статистика</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const bg = role === "child"
    ? "bg-gradient-to-br from-[#FFF0F5] via-[#F0EEFF] to-[#E8F8FF]"
    : "bg-gradient-to-br from-[#F0F4FF] via-[#F8F9FF] to-[#F4F0FF]";

  const font = role === "child" ? "Nunito, sans-serif" : "Golos Text, sans-serif";

  return (
    <div className={`min-h-screen ${bg}`} style={{ fontFamily: font }}>
      <AppModals
        levelUpLevel={child.levelUpLevel}
        newAchievements={child.newAchievements}
        showStar={child.showStar}
        gradeNotifChild={child.gradeNotifChild}
        parentLevelUpLevel={parent.parentLevelUpLevel}
        parentXp={parent.parentXp}
        streakBonusModal={parent.streakBonusModal}
        gradeNotifParent={child.gradeNotifParent}
        onCloseLevelUp={() => child.setLevelUpLevel(null)}
        onCloseParentLevelUp={() => parent.setParentLevelUpLevel(null)}
        onCloseStreakBonus={() => parent.setStreakBonusModal(null)}
        onCloseNewAchievements={() => child.setNewAchievements([])}
        onCloseGradeNotifParent={() => child.setGradeNotifParent(null)}
        onCloseGradeNotifChild={() => child.setGradeNotifChild(null)}
      />

      {/* Role switcher pill */}
      <div className="flex justify-center pt-4 px-4">
        <div
          className="flex rounded-2xl p-1 gap-1 shadow-md"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(10px)" }}
        >
          <button
            onClick={() => { tg()?.HapticFeedback?.impactOccurred("light"); setRole("child"); }}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              role === "child"
                ? "bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white shadow-md scale-105"
                : "text-gray-500"
            }`}
          >
            👧 Ребёнок
          </button>
          <button
            onClick={() => { tg()?.HapticFeedback?.impactOccurred("light"); setRole("parent"); }}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
              role === "parent"
                ? "bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white shadow-md scale-105"
                : "text-gray-500"
            }`}
          >
            👨 Родитель
          </button>
        </div>
      </div>

      {role === "child" && (
        <>
          <ChildProfileSwitcher
            profiles={child.children}
            activeId={child.activeChildId}
            onSwitch={id => child.setActiveChildId(id)}
          />
          <ChildView
            key={child.activeChildId}
            childTab={child.childTab}
            setChildTab={child.setChildTab}
            profile={child.activeChild}
            handleTaskToggle={(taskId, taskStars) => {
              tg()?.HapticFeedback?.impactOccurred("light");
              child.handleTaskToggle(taskId, taskStars);
            }}
            handleBuy={(itemId, cost) => {
              tg()?.HapticFeedback?.notificationOccurred("success");
              child.handleBuy(itemId, cost);
            }}
            onOpenStickerPack={() => {
              tg()?.HapticFeedback?.impactOccurred("medium");
              return child.handleOpenStickerPack();
            }}
            onSubmitGrade={(subject, grade, date) =>
              child.handleSubmitGrade(child.activeChildId, subject, grade, date)
            }
            onAttachPhoto={child.handleAttachPhoto}
          />
        </>
      )}

      {role === "parent" && (
        <ParentView
          parentTab={parent.parentTab}
          setParentTab={parent.setParentTab}
          parentXp={parent.parentXp}
          parentPoints={parent.parentPoints}
          streak={parent.streak}
          confirmedTasks={parent.confirmedTasks}
          purchasedPrizes={parent.purchasedPrizes}
          gradeRequests={allGradeRequests}
          photoProofs={allPhotoProofs}
          pendingConfirmTasks={allPendingConfirmTasks}
          childNames={childNames}
          onAction={(action) => {
            tg()?.HapticFeedback?.impactOccurred("light");
            parent.handleParentAction(action);
          }}
          onAddTask={child.handleAddTask}
          onConfirmTask={(taskId) => {
            tg()?.HapticFeedback?.notificationOccurred("success");
            parent.handleConfirmTask(taskId);
          }}
          onConfirmChildTask={(childId, taskId) => {
            tg()?.HapticFeedback?.notificationOccurred("success");
            parent.handleConfirmChildTask(childId, taskId);
          }}
          onRejectConfirmTask={child.handleRejectConfirmTask}
          onBuyPrize={parent.handleBuyPrize}
          onStreakClaim={() => {
            tg()?.HapticFeedback?.notificationOccurred("success");
            parent.handleStreakClaim();
          }}
          onApproveGrade={(id) => {
            tg()?.HapticFeedback?.notificationOccurred("success");
            const req = allGradeRequests.find(r => r.id === id);
            if (req) child.handleApproveGrade(req.childId, id);
          }}
          onRejectGrade={(id) => {
            const req = allGradeRequests.find(r => r.id === id);
            if (req) child.handleRejectGrade(req.childId, id);
          }}
          onApprovePhoto={(childId, taskId) => {
            tg()?.HapticFeedback?.notificationOccurred("success");
            child.handleApprovePhoto(childId, taskId);
          }}
          onRejectPhoto={child.handleRejectPhoto}
        />
      )}
    </div>
  );
}
