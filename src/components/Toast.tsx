"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Toast({
  message,
  type = "error",
  onClose,
}: {
  message: string;
  type?: "error" | "success";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-6 left-4 right-4 z-50 mx-auto max-w-md rounded-xl p-4 text-center font-semibold shadow-lg ${
          type === "error"
            ? "bg-red-500/90 text-white"
            : "bg-green-500/90 text-white"
        }`}
      >
        {message}
        <button
          onClick={onClose}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
        >
          &times;
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
