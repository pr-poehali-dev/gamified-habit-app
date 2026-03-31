import { useState } from "react";
import { type Mode, type GradeRequest } from "@/components/demo/types";
import { type PendingConfirmTask } from "@/components/demo/ParentTasksTab";
import { ChildProfileSwitcher } from "@/components/demo/ChildProfileSwitcher";
import ChildView from "@/components/demo/ChildView";
import ParentView from "@/components/demo/ParentView";
import { AppModals } from "./AppModals";
import { useChildState } from "./useChildState";
import { useParentState } from "./useParentState";

export default function Index() {
  const [mode, setMode] = useState<Mode>("child");

  // ── Child state & handlers ──
  const child = useChildState(0); // streak.current injected below after parent init

  // ── Parent state & handlers ──
  const parent = useParentState(
    child.grantStars,
    (childId) => child.children.find(c => c.id === childId),
  );

  // Derived data for parent view
  const allGradeRequests: (GradeRequest & { childId: number; childName: string })[] =
    child.children.flatMap(c =>
      c.gradeRequests.map(r => ({ ...r, childId: c.id, childName: c.name }))
    );

  const childNames = child.children.map(c => ({ id: c.id, name: c.name }));

  const allPendingConfirmTasks: PendingConfirmTask[] = child.children.flatMap(c =>
    c.pendingConfirmTaskIds.map(taskId => {
      const task = c.tasks.find(t => t.id === taskId);
      return task ? {
        taskId,
        childId: c.id,
        childName: c.name,
        childAvatar: c.avatar,
        taskTitle: task.title,
        taskEmoji: task.emoji,
        taskStars: task.stars,
      } : null;
    }).filter(Boolean) as PendingConfirmTask[]
  );

  const allPhotoProofs = child.children.flatMap(c =>
    c.photoProofs.map(p => ({
      ...p,
      childId: c.id,
      childName: c.name,
      taskTitle: c.tasks.find(t => t.id === p.taskId)?.title ?? "",
    }))
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
          profiles={child.children}
          activeId={child.activeChildId}
          onSwitch={id => child.setActiveChildId(id)}
        />
      )}

      {/* Child view */}
      {mode === "child" && (
        <ChildView
          key={child.activeChildId}
          childTab={child.childTab}
          setChildTab={child.setChildTab}
          profile={child.activeChild}
          handleTaskToggle={child.handleTaskToggle}
          handleBuy={child.handleBuy}
          onOpenStickerPack={child.handleOpenStickerPack}
          onSubmitGrade={(subject, grade, date) =>
            child.handleSubmitGrade(child.activeChildId, subject, grade, date)
          }
          onAttachPhoto={child.handleAttachPhoto}
        />
      )}

      {/* Parent view */}
      {mode === "parent" && (
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
          onAction={parent.handleParentAction}
          onAddTask={child.handleAddTask}
          onConfirmTask={parent.handleConfirmTask}
          onConfirmChildTask={parent.handleConfirmChildTask}
          onRejectConfirmTask={child.handleRejectConfirmTask}
          onBuyPrize={parent.handleBuyPrize}
          onStreakClaim={parent.handleStreakClaim}
          onApproveGrade={(id) => {
            const req = allGradeRequests.find(r => r.id === id);
            if (req) child.handleApproveGrade(req.childId, id);
          }}
          onRejectGrade={(id) => {
            const req = allGradeRequests.find(r => r.id === id);
            if (req) child.handleRejectGrade(req.childId, id);
          }}
          onApprovePhoto={child.handleApprovePhoto}
          onRejectPhoto={child.handleRejectPhoto}
        />
      )}
    </div>
  );
}
