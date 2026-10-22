"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeError } from "@/lib/pdf/errors";

type Status = "idle" | "working" | "done" | "error";

/**
 * Shared status handling for a panel's main button: idle → working → done (a
 * brief confirmation, then back to idle) or error (with a readable message
 * that stays until the next attempt).
 */
export function useAsyncAction() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const run = useCallback(async (action: () => Promise<void>) => {
    clearTimeout(timer.current);
    setStatus("working");
    setError(null);
    try {
      await action();
      setStatus("done");
      timer.current = setTimeout(() => setStatus("idle"), 1800);
    } catch (e) {
      setError(describeError(e));
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, working: status === "working", run, reset };
}
