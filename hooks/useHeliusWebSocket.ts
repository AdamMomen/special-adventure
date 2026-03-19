"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

function getWssUrl(): string | null {
  const rpc = process.env.NEXT_PUBLIC_HELIUS_RPC;
  if (!rpc?.startsWith("https://")) return null;
  return rpc.replace("https://", "wss://");
}

export function useHeliusWebSocket(wallet: string | null, onActivity?: () => void) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const onActivityRef = useRef(onActivity);
  onActivityRef.current = onActivity;
  const [isConnected, setIsConnected] = useState(false);

  const refetch = useCallback(() => {
    if (!wallet) return;
    queryClient.invalidateQueries({ queryKey: ["balances", wallet] });
    queryClient.invalidateQueries({ queryKey: ["history", wallet] });
    queryClient.invalidateQueries({ queryKey: ["pnl", wallet] });
  }, [wallet, queryClient]);

  useEffect(() => {
    if (!wallet) {
      setIsConnected(false);
      return;
    }

    const wssUrl = getWssUrl();
    if (!wssUrl) {
      setIsConnected(false);
      return;
    }

    const connect = () => {
      const ws = new WebSocket(wssUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "accountSubscribe",
            params: [
              wallet,
              { encoding: "jsonParsed", commitment: "confirmed" },
            ],
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.result !== undefined) {
            setIsConnected(true);
          }
          if (msg.method === "accountNotification") {
            refetch();
            onActivityRef.current?.();
          } else if (msg.result !== undefined) {
            refetch();
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
      ws.onclose = () => {
        wsRef.current = null;
        setIsConnected(false);
      };
    };

    connect();

    return () => {
      setIsConnected(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [wallet, refetch]);

  return { isConnected, refetch };
}
