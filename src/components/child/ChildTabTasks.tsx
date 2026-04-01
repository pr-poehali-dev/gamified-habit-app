import { useRef, useState } from "react";

type Task = {
  id: number; title: string; stars: number; emoji: string;
  status: string; requirePhoto: boolean; requireConfirm: boolean; photoStatus: string;
  deadline?: string | null;
  extensionRequested?: boolean;
  extensionGranted?: boolean;
};

type Props = {
  tasks: Task[];
  pendingTasks: Task[];
  doneTasks: Task[];
  approvedTasks: Task[];
  onCompleteTask: (id: number, photoBase64?: string) => void;
  onRequestExtension: (id: number) => void;
  onDeleteTask?: (id: number) => void;
};

function formatDeadlineChild(deadline: string): { text: string; urgent: boolean; overdue: boolean } {
  const d = new Date(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff < 0) return { text: "⚠️ Срок истёк", urgent: true, overdue: true };
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const urgent = diff < 2 * 3600000; // менее 2 часов
  if (h > 48) {
    const days = Math.ceil(h / 24);
    return { text: `⏰ ${days} дн.`, urgent: false, overdue: false };
  }
  if (h > 0) return { text: `⏰ ${h}ч ${m}м`, urgent, overdue: false };
  return { text: `⏰ ${m}м`, urgent: true, overdue: false };
}

// Компонент выбора фото для задачи
function PhotoPicker({
  taskId,
  taskTitle,
  taskEmoji,
  onConfirm,
  onCancel,
}: {
  taskId: number;
  taskTitle: string;
  taskEmoji: string;
  onConfirm: (photoBase64: string) => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const originalBase64 = e.target?.result as string;
      // Сжимаем фото через canvas, чтобы избежать ошибки 413 (слишком большой запрос)
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 1024; // макс. сторона в пикселях
        const QUALITY = 0.7;   // качество JPEG 70%
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", QUALITY);
          setPreview(compressed);
        } else {
          // fallback — используем оригинал
          setPreview(originalBase64);
        }
        setLoading(false);
      };
      img.onerror = () => {
        // fallback — используем оригинал
        setPreview(originalBase64);
        setLoading(false);
      };
      img.src = originalBase64;
    };
    reader.readAsDataURL(file);
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
    }
  };

  const openGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // сброс значения, чтобы можно было выбрать то же фото повторно
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" style={{ animation: "fadeIn 0.2s ease" }}>
      <div className="w-full max-w-md bg-white rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl" style={{ animation: "slideUp 0.3s ease" }}>
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{taskEmoji}</span>
          <div>
            <p className="font-black text-[#2D1B69] text-base">{taskTitle}</p>
            <p className="text-sm text-purple-500 font-bold">📸 Прикрепи фото выполнения</p>
          </div>
        </div>

        {/* Скрытый input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleInputChange}
        />

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && !preview && (
          <div className="space-y-3 mb-5">
            <button
              onClick={openCamera}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-base active:scale-95 transition-transform flex items-center justify-center gap-3 shadow-sm">
              <span className="text-2xl">📷</span>
              Сделать фото
            </button>
            <button
              onClick={openGallery}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6B7BFF] to-[#9B6BFF] text-white font-black text-base active:scale-95 transition-transform flex items-center justify-center gap-3 shadow-sm">
              <span className="text-2xl">🖼️</span>
              Выбрать из галереи
            </button>
          </div>
        )}

        {!loading && preview && (
          <div className="mb-5">
            <img
              src={preview}
              alt="Фото выполнения"
              className="w-full rounded-2xl object-cover max-h-64 shadow-sm border border-purple-100"
            />
            <button
              onClick={() => setPreview(null)}
              className="mt-2 w-full py-2 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">
              🔄 Выбрать другое фото
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm active:scale-95 transition-transform">
            Отмена
          </button>
          <button
            disabled={!preview}
            onClick={() => preview && onConfirm(preview)}
            className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${preview ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white active:scale-95" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            ✓ Отправить
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChildTabTasks({ tasks, pendingTasks, doneTasks, approvedTasks, onCompleteTask, onRequestExtension, onDeleteTask }: Props) {
  // Задача, для которой открыт пикер фото
  const [photoPickerTask, setPhotoPickerTask] = useState<Task | null>(null);
  // Подтверждение удаления
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleTaskClick = (task: Task) => {
    if (task.requirePhoto) {
      // Открываем пикер фото
      setPhotoPickerTask(task);
    } else {
      onCompleteTask(task.id);
    }
  };

  const handlePhotoConfirm = (photoBase64: string) => {
    if (photoPickerTask) {
      onCompleteTask(photoPickerTask.id, photoBase64);
      setPhotoPickerTask(null);
    }
  };

  return (
    <>
      {/* Пикер фото поверх всего */}
      {photoPickerTask && (
        <PhotoPicker
          taskId={photoPickerTask.id}
          taskTitle={photoPickerTask.title}
          taskEmoji={photoPickerTask.emoji}
          onConfirm={handlePhotoConfirm}
          onCancel={() => setPhotoPickerTask(null)}
        />
      )}

      <h2 className="text-lg font-black text-[#2D1B69]">Мои задачи</h2>

      {doneTasks.map(task => (
        <div key={task.id} className="rounded-3xl p-4 flex items-center gap-4 bg-gradient-to-r from-amber-300 to-orange-400 shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white/20">{task.emoji}</div>
          <div className="flex-1">
            <p className="font-black text-base text-white">{task.title}</p>
            <p className="text-white/80 text-sm font-bold">⏳ Ждёт проверки родителя</p>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/30">
            <span className="text-lg">⏳</span>
          </div>
        </div>
      ))}

      {pendingTasks.map((task, i) => {
        const deadlineInfo = task.deadline ? formatDeadlineChild(task.deadline) : null;
        const isOverdue = deadlineInfo?.overdue ?? false;
        const canComplete = !isOverdue;
        const extensionAlreadyRequested = task.extensionRequested;

        return (
          <div key={task.id}
            className="rounded-3xl overflow-hidden bg-white/90 shadow-sm"
            style={{ animationDelay: `${i * 0.07}s` }}>
            <div
              onClick={() => canComplete && !extensionAlreadyRequested ? handleTaskClick(task) : undefined}
              className={`p-4 flex items-center gap-4 ${canComplete && !extensionAlreadyRequested ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-300" : ""}`}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br from-[#FF9BE0]/20 to-[#9B6BFF]/20">{task.emoji}</div>
              <div className="flex-1">
                <p className="font-black text-base text-[#2D1B69]">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-sm font-bold text-yellow-500">{task.stars}⭐</p>
                  {task.requireConfirm && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">✅ нужна проверка</span>}
                  {task.requirePhoto && <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">📸 нужно фото</span>}
                </div>
                {deadlineInfo && (
                  <p className={`text-xs font-bold mt-1 ${deadlineInfo.overdue ? "text-red-500" : deadlineInfo.urgent ? "text-orange-500" : "text-gray-500"}`}>
                    {deadlineInfo.text}
                  </p>
                )}
                {extensionAlreadyRequested && !isOverdue && (
                  <p className="text-xs font-bold text-blue-500 mt-0.5">⏰ Запрос на доп. время отправлен</p>
                )}
                {task.extensionGranted && (
                  <p className="text-xs font-bold text-green-600 mt-0.5">✅ Родитель продлил срок!</p>
                )}
              </div>
              {canComplete && !extensionAlreadyRequested && (
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${task.requirePhoto ? "bg-gradient-to-br from-purple-400 to-pink-500" : "bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B]"}`}>
                  <span className="text-white text-sm">{task.requirePhoto ? "📸" : "→"}</span>
                </div>
              )}
            </div>

            {/* Кнопки когда срок истёк */}
            {isOverdue && !extensionAlreadyRequested && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => onRequestExtension(task.id)}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold text-sm active:scale-95 transition-transform">
                  ⏰ Попросить у родителя доп. время
                </button>
              </div>
            )}

            {/* Кнопка запроса доп. времени до истечения срока, если срок близится */}
            {!isOverdue && deadlineInfo?.urgent && !extensionAlreadyRequested && (
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => handleTaskClick(task)}
                  className={`flex-1 py-2.5 rounded-2xl text-white font-bold text-sm active:scale-95 transition-transform ${task.requirePhoto ? "bg-gradient-to-br from-purple-400 to-pink-500" : "bg-gradient-to-br from-[#FF6B9D] to-[#FF9B6B]"}`}>
                  {task.requirePhoto ? "📸 Фото!" : "✓ Выполнил!"}
                </button>
                <button
                  onClick={() => onRequestExtension(task.id)}
                  className="flex-1 py-2.5 rounded-2xl bg-white border-2 border-blue-200 text-blue-500 font-bold text-sm active:scale-95 transition-transform">
                  ⏰ Нужно время
                </button>
              </div>
            )}
          </div>
        );
      })}

      {approvedTasks.map(task => (
        <div key={task.id} className="rounded-3xl overflow-hidden bg-gradient-to-r from-green-400 to-emerald-500 scale-[0.98] shadow-sm">
          <div className="p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-white/20">{task.emoji}</div>
            <div className="flex-1">
              <p className="font-black text-base text-white line-through opacity-80">{task.title}</p>
              <p className="text-white/70 text-sm font-bold">+{task.stars}⭐ начислено</p>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/30">
              <span className="text-white text-base">✓</span>
            </div>
          </div>
          {onDeleteTask && (
            confirmDeleteId === task.id ? (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs font-bold text-white/90 text-center">Удалить из истории?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-2 rounded-2xl bg-white/20 text-white font-bold text-xs active:scale-95 transition-transform">Оставить</button>
                  <button onClick={() => { onDeleteTask(task.id); setConfirmDeleteId(null); }} className="flex-1 py-2 rounded-2xl bg-white/40 text-white font-bold text-xs active:scale-95 transition-transform">🗑 Удалить</button>
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4">
                <button onClick={() => setConfirmDeleteId(task.id)} className="w-full py-2 rounded-2xl bg-white/20 text-white/80 font-bold text-xs active:scale-95 transition-transform">
                  🗑 Убрать из списка
                </button>
              </div>
            )
          )}
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-bold text-gray-500">Все задачи выполнены!</p>
        </div>
      )}
    </>
  );
}