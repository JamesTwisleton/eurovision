"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";

export function useSocket(partyKey?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (partyKey) {
      socket.emit("join_party", partyKey);
    }

    return () => {
      // Don't disconnect — shared singleton.
      // Rooms are left automatically on disconnect.
    };
  }, [partyKey]);

  return socketRef;
}
