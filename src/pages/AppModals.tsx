import { LevelUpModal, ParentLevelUpModal } from "@/components/demo/XpBar";
import { StreakBonusModal } from "@/components/demo/StreakCard";
import { NewAchievementModal } from "@/components/demo/AchievementBadge";
import { GradeToast } from "@/components/demo/GradeExchange";
import { getParentLevelInfo, type AchievementId } from "@/components/demo/types";
import { type GradeNotif } from "./useChildState";

type Props = {
  // Child modals
  levelUpLevel: number | null;
  newAchievements: AchievementId[];
  showStar: boolean;
  gradeNotifChild: GradeNotif | null;
  // Parent modals
  parentLevelUpLevel: number | null;
  parentXp: number;
  streakBonusModal: { day: number; xp: number; points: number } | null;
  gradeNotifParent: { subject: string; grade: number; childName: string } | null;
  // Setters
  onCloseLevelUp: () => void;
  onCloseParentLevelUp: () => void;
  onCloseStreakBonus: () => void;
  onCloseNewAchievements: () => void;
  onCloseGradeNotifParent: () => void;
  onCloseGradeNotifChild: () => void;
};

export function AppModals({
  levelUpLevel,
  newAchievements,
  showStar,
  gradeNotifChild,
  parentLevelUpLevel,
  parentXp,
  streakBonusModal,
  gradeNotifParent,
  onCloseLevelUp,
  onCloseParentLevelUp,
  onCloseStreakBonus,
  onCloseNewAchievements,
  onCloseGradeNotifParent,
  onCloseGradeNotifChild,
}: Props) {
  return (
    <>
      {levelUpLevel !== null && (
        <LevelUpModal level={levelUpLevel} onClose={onCloseLevelUp} />
      )}
      {parentLevelUpLevel !== null && (
        <ParentLevelUpModal
          level={parentLevelUpLevel}
          points={getParentLevelInfo(parentXp).totalPoints}
          onClose={onCloseParentLevelUp}
        />
      )}
      {streakBonusModal !== null && (
        <StreakBonusModal
          day={streakBonusModal.day}
          xp={streakBonusModal.xp}
          points={streakBonusModal.points}
          onClose={onCloseStreakBonus}
        />
      )}
      {newAchievements.length > 0 && (
        <NewAchievementModal ids={newAchievements} onClose={onCloseNewAchievements} />
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
          onClose={onCloseGradeNotifParent}
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
          onClose={onCloseGradeNotifChild}
        />
      )}
    </>
  );
}
