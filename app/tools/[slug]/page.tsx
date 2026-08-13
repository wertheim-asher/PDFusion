import { notFound } from "next/navigation";
import { TOOLS } from "@/lib/tools";
import { ToolPageClient } from "./ToolPageClient";

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in TOOLS)) {
    notFound();
  }
  return <ToolPageClient slug={slug as keyof typeof TOOLS} />;
}

export function generateStaticParams() {
  return Object.keys(TOOLS).map((slug) => ({ slug }));
}
