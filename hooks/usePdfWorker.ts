"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PdfJob, PdfJobRequest, PdfJobResponse, PdfJobResult } from "@/lib/pdf/jobs";

type PendingEntry = {
  resolve: (result: PdfJobResult) => void;
  reject: (err: Error) => void;
};

let nextId = 0;

function collectTransferables(job: PdfJob): ArrayBuffer[] {
  switch (job.type) {
    case "merge":
      return job.bytesList;
    case "imagesToPdf":
      return job.images.map((i) => i.bytes);
    case "split":
    case "organize":
    case "watermark":
    case "pageNumbers":
    case "crop":
    case "protect":
    case "unlock":
      return [job.bytes];
  }
}

export function usePdfWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingEntry>>(new Map());

  useEffect(() => {
    const worker = new Worker(new URL("../workers/pdf.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onerror = (event: ErrorEvent) => {
      console.error("[pdf.worker] error:", event.message);
    };
    worker.onmessage = (event: MessageEvent<PdfJobResponse>) => {
      const { id } = event.data;
      const pending = pendingRef.current.get(id);
      if (!pending) return;
      pendingRef.current.delete(id);
      if (event.data.ok) {
        pending.resolve({ filename: event.data.filename, bytes: event.data.bytes });
      } else {
        pending.reject(new Error(event.data.error));
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const runJob = useCallback((job: PdfJob): Promise<PdfJobResult> => {
    const worker = workerRef.current;
    if (!worker) {
      return Promise.reject(new Error("PDF worker is not ready yet."));
    }
    const id = String(nextId++);
    const request = { ...job, id } as PdfJobRequest;
    const transferables = collectTransferables(job);
    return new Promise<PdfJobResult>((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
      worker.postMessage(request, transferables);
    });
  }, []);

  return { runJob };
}
