"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

export function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "error" | "success";
  onClose: () => void;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - 1));
    }, 40);

    const closeTimer = setTimeout(onClose, 4000);

    return () => {
      clearInterval(timer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "fixed bottom-6 left-4 right-4 z-[100] mx-auto max-w-sm overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl",
          type === "error"
            ? "bg-red-500/90 text-white"
            : "bg-green-500/90 text-white"
        )}
      >
        <div className="relative px-6 py-4">
          <p className="pr-6 text-sm font-bold leading-tight">{message}</p>
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div
          className="h-1 bg-white/30 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
