import { useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { type PhotoProof } from "./types";

// ─── Child: photo attach button + preview ────────────────────────────────────

type AttachPhotoProps = {
  taskId: number;
  taskTitle: string;
  existingProof?: PhotoProof;
  onAttach: (taskId: number, dataUrl: string) => void;
  onComplete: () => void;
};

export function TaskPhotoAttach({ taskId, taskTitle, existingProof, onAttach, onComplete }: AttachPhotoProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingProof?.dataUrl ?? null);
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      onAttach(taskId, dataUrl);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInput}
      />

      {/* Upload zone */}
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-[#FF6B9D]/50 rounded-2xl p-6 text-center cursor-pointer hover:border-[#FF6B9D] hover:bg-pink-50/50 transition-all active:scale-98"
        >
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#FF6B9D] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400 font-semibold">Загружаю...</p>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-2">📸</div>
              <p className="font-bold text-[#2D1B69] text-sm">Прикрепи фото</p>
              <p className="text-xs text-gray-400 mt-1">Нажми или перетащи изображение</p>
              <p className="text-xs text-gray-300 mt-0.5">«{taskTitle}»</p>
            </>
          )}
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <img src={preview} alt="Фото выполнения" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="text-white text-xs font-bold bg-black/40 px-2 py-1 rounded-lg">
              ✓ Фото прикреплено
            </span>
            <button
              onClick={e => { e.stopPropagation(); setPreview(null); inputRef.current?.click(); }}
              className="text-white text-xs font-bold bg-black/40 px-2 py-1 rounded-lg hover:bg-black/60 transition-colors"
            >
              Заменить
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {preview && (
          <button
            onClick={onComplete}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#FF9B6B] text-white font-black text-sm shadow-md active:scale-95 transition-all"
          >
            ✅ Отправить на проверку
          </button>
        )}
        <button
          onClick={() => inputRef.current?.click()}
          className={`${preview ? "w-12 h-12" : "flex-1 py-3"} rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-gray-200`}
        >
          {preview ? <Icon name="Camera" size={20} /> : <><Icon name="Camera" size={16} /> Сделать фото</>}
        </button>
      </div>
    </div>
  );
}

// ─── Parent: photo review card ────────────────────────────────────────────────

type ReviewCardProps = {
  proof: PhotoProof & { childName: string; taskTitle: string };
  onApprove: (taskId: number) => void;
  onReject: (taskId: number) => void;
};

export function PhotoReviewCard({ proof, onApprove, onReject }: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
      <div
        className="cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="relative">
          <img
            src={proof.dataUrl}
            alt="Фото выполнения"
            className={`w-full object-cover transition-all duration-300 ${expanded ? "h-56" : "h-32"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute top-2 left-2">
            <span className="bg-purple-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">📸 Фотоотчёт</span>
          </div>
          <div className="absolute bottom-2 right-2">
            <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={16} className="text-white" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="font-black text-[#1E1B4B] text-sm">{proof.taskTitle}</p>
        <p className="text-xs text-gray-400 mt-0.5">{proof.childName} · {new Date(proof.uploadedAt).toLocaleDateString("ru-RU")}</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onReject(proof.taskId)}
            className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-xs hover:bg-red-50 hover:text-red-500 transition-colors active:scale-95"
          >
            ✗ Отклонить
          </button>
          <button
            onClick={() => onApprove(proof.taskId)}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold text-xs shadow-sm hover:shadow-md active:scale-95 transition-all"
          >
            ✓ Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Parent: photo proof badge on task card ───────────────────────────────────

export function PhotoProofBadge({ status, onClick }: { status: PhotoProof["status"]; onClick?: () => void }) {
  const map = {
    pending_review: { label: "📸 Ожидает проверки", cls: "bg-purple-100 text-purple-600" },
    approved:       { label: "📸 Фото принято", cls: "bg-green-100 text-green-600" },
    rejected:       { label: "📸 Фото отклонено", cls: "bg-red-100 text-red-500" },
  };
  const { label, cls } = map[status];
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls} ${onClick ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
    >
      {label}
    </button>
  );
}
