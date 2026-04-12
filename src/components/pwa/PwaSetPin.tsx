import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { setPin } from "./pwaApi";

interface Props {
  sessionToken: string;
  onComplete: () => void;
}

export default function PwaSetPin({ sessionToken, onComplete }: Props) {
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const newPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitInput = (
    index: number,
    val: string,
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete: (code: string) => void
  ) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...arr];
    next[index] = val.slice(-1);
    setArr(next);
    if (val && index < arr.length - 1) refs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) onComplete(next.join(""));
  };

  const handleDigitKeyDown = (
    index: number,
    e: React.KeyboardEvent,
    arr: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === "Backspace" && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handleNewPinComplete = (code: string) => {
    if (code.length === 4) {
      setStep("confirm");
      setTimeout(() => confirmPinRefs.current[0]?.focus(), 100);
    }
  };

  const handleConfirmPinComplete = async (code: string) => {
    const entered = newPin.join("");
    if (code !== entered) {
      setError("Коды не совпадают. Попробуйте ещё раз.");
      setConfirmPin(["", "", "", ""]);
      setNewPin(["", "", "", ""]);
      setStep("enter");
      setTimeout(() => newPinRefs.current[0]?.focus(), 100);
      return;
    }
    setError("");
    setLoading(true);
    const res = await setPin(sessionToken, code);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onComplete();
  };

  const digitInputs = (
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onDone: (code: string) => void
  ) => (
    <div className="flex gap-3 justify-center">
      {arr.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleDigitInput(i, e.target.value, arr, setArr, refs, onDone)}
          onKeyDown={(e) => handleDigitKeyDown(i, e, arr, refs)}
          autoFocus={i === 0}
          className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-[#6B7BFF] focus:outline-none transition-colors"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] to-[#F4F0FF] p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">🔒</div>
          <h1 className="text-xl font-bold text-gray-900">Установите код-пароль</h1>
          <p className="text-sm text-gray-500">
            {step === "enter"
              ? "Придумайте 4-значный код для быстрого входа без SMS"
              : "Повторите код-пароль для подтверждения"}
          </p>
        </div>

        <div className="space-y-4">
          {step === "enter"
            ? digitInputs(newPin, setNewPin, newPinRefs, handleNewPinComplete)
            : digitInputs(confirmPin, setConfirmPin, confirmPinRefs, handleConfirmPinComplete)
          }
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {step === "confirm" && (
            <Button
              className="w-full h-12 text-base bg-[#6B7BFF] hover:bg-[#5A6AEE] text-white"
              onClick={() => handleConfirmPinComplete(confirmPin.join(""))}
              disabled={loading || confirmPin.some((d) => !d)}
            >
              {loading ? "Сохраняем..." : "Установить код-пароль"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
