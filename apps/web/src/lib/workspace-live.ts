"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export type LiveStatus = "connecting" | "live" | "disconnected";

export function useWorkspaceLive(enabled: boolean) {
  const client = useQueryClient();
  const [status, setStatus] = useState<LiveStatus>("connecting");

  useEffect(() => {
    if (!enabled) return;
    const origin = process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, "");
    const socket = io(`${origin ?? ""}/workspace`, {
      withCredentials: true,
      path: "/api/v1/socket.io",
      transports: ["websocket", "polling"],
    });
    const refresh = async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["communication"] }),
        client.invalidateQueries({ queryKey: ["work"] }),
        client.invalidateQueries({ queryKey: ["workspace-summary"] }),
        client.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    };
    socket.on("connect", () => setStatus("connecting"));
    socket.on("workspace:ready", () => {
      setStatus("live");
      void refresh();
    });
    socket.on("workspace:changed", () => void refresh());
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", () => setStatus("disconnected"));
    return () => {
      socket.disconnect();
    };
  }, [client, enabled]);

  return status;
}
