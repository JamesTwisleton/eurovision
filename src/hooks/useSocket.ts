"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useSocket(juryKey?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (juryKey) {
      socket.emit("join_jury", juryKey);
    }

    return () => {
      // Don't disconnect — shared singleton.
      // Rooms are left automatically on disconnect.
    };
  }, [juryKey]);

  return socketRef;
}
