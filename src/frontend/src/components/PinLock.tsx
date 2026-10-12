import { Delete, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

interface PinLockProps {
  onUnlock: () => void;
}

export function PinLock({ onUnlock }: PinLockProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleDigit = (d: string) => {
    if (digits.length >= 4) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length === 4) {
      validatePin(next.join(""));
    }
  };

  const handleBackspace = () => {
    setDigits((prev) => prev.slice(0, -1));
    setError(false);
  };

  const validatePin = (pin: string) => {
    const stored = localStorage.getItem("wb_pin") ?? "1234";
    if (pin === stored) {
      onUnlock();
    } else {
      setShake(true);
      setError(true);
      setTimeout(() => {
        setDigits([]);
        setError(false);
        setShake(false);
      }, 600);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      if (e.key === "Backspace") handleBackspace();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const keys = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "backspace",
    "0",
    "empty",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar"
      data-ocid="pinlock.modal"
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 39px, oklch(0.9 0 0) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, oklch(0.9 0 0) 40px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center gap-8 px-6"
      >
        {/* Logo / Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-1">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-sidebar-foreground">
            WeighBridge Pro
          </h1>
          <p className="text-sm text-sidebar-foreground/50">
            Enter PIN to continue
          </p>
        </div>

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex gap-4"
          data-ocid="pinlock.panel"
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                digits.length > i
                  ? error
                    ? "bg-destructive border-destructive"
                    : "bg-primary border-primary"
                  : "border-sidebar-foreground/30 bg-transparent"
              }`}
            />
          ))}
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-destructive text-sm font-medium -mt-4"
              data-ocid="pinlock.error_state"
            >
              Incorrect PIN
            </motion.p>
          )}
        </AnimatePresence>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {keys.map((k) => {
            if (k === "empty") {
              return <div key="empty" />;
            }
            if (k === "backspace") {
              return (
                <button
                  type="button"
                  key="backspace"
                  onClick={handleBackspace}
                  data-ocid="pinlock.delete_button"
                  className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-sidebar-foreground/60 border border-sidebar-foreground/10 bg-sidebar-foreground/5 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground active:scale-95 transition-all duration-100 cursor-pointer select-none"
                  aria-label="Backspace"
                >
                  <Delete className="w-5 h-5" />
                </button>
              );
            }
            return (
              <button
                type="button"
                key={k}
                onClick={() => handleDigit(k)}
                data-ocid="pinlock.button"
                className="w-[72px] h-[72px] rounded-xl flex items-center justify-center text-2xl font-medium text-sidebar-foreground border border-sidebar-foreground/10 bg-sidebar-foreground/5 hover:bg-primary/20 hover:border-primary/30 hover:text-primary active:scale-95 active:bg-primary/30 transition-all duration-100 cursor-pointer select-none"
              >
                {k}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-sidebar-foreground/30">Default PIN: 1234</p>
      </motion.div>
    </div>
  );
}
