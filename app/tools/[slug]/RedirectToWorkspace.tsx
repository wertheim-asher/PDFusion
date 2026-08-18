"use client";

import { useEffect } from "react";

export function RedirectToWorkspace({ slug }: { slug: string }) {
  useEffect(() => {
    window.location.replace(`/?tool=${encodeURIComponent(slug)}`);
  }, [slug]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      <p>Taking you to the new PDFusion editor…</p>
    </div>
  );
}
