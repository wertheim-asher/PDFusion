import { RedirectToWorkspace } from "./RedirectToWorkspace";
import { TOOLS } from "@/lib/tools";

// The per-tool pages were replaced by a single workspace at "/" with tools as
// buttons. Static export can't do a real server redirect (no server), so
// each old URL statically renders a tiny client component that redirects on
// load, keeping any bookmarked/shared /tools/<slug> links useful.
export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RedirectToWorkspace slug={slug} />;
}

export function generateStaticParams() {
  return Object.keys(TOOLS).map((slug) => ({ slug }));
}
