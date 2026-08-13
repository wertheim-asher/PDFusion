"use client";

import Link from "next/link";
import { MergeTool } from "@/components/tools/MergeTool";
import { SplitTool } from "@/components/tools/SplitTool";
import { OrganizeTool } from "@/components/tools/OrganizeTool";
import { RotateTool } from "@/components/tools/RotateTool";
import { WatermarkTool } from "@/components/tools/WatermarkTool";
import { PageNumbersTool } from "@/components/tools/PageNumbersTool";
import { PdfToJpgTool } from "@/components/tools/PdfToJpgTool";
import { JpgToPdfTool } from "@/components/tools/JpgToPdfTool";
import { CompressTool } from "@/components/tools/CompressTool";
import { ProtectTool } from "@/components/tools/ProtectTool";
import { UnlockTool } from "@/components/tools/UnlockTool";
import { TOOLS, type ToolSlug } from "@/lib/tools";

export function ToolPageClient({ slug }: { slug: ToolSlug }) {
  switch (slug) {
    case "merge-pdf":
      return <MergeTool />;
    case "split-pdf":
      return <SplitTool />;
    case "organize-pdf":
      return <OrganizeTool />;
    case "rotate-pdf":
      return <RotateTool />;
    case "watermark-pdf":
      return <WatermarkTool />;
    case "page-numbers-pdf":
      return <PageNumbersTool />;
    case "pdf-to-jpg":
      return <PdfToJpgTool />;
    case "jpg-to-pdf":
      return <JpgToPdfTool />;
    case "compress-pdf":
      return <CompressTool />;
    case "protect-pdf":
      return <ProtectTool />;
    case "unlock-pdf":
      return <UnlockTool />;
    default:
      return <ComingSoon slug={slug} />;
  }
}

function ComingSoon({ slug }: { slug: ToolSlug }) {
  const meta = TOOLS[slug];
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="text-3xl font-bold text-gray-900">{meta.title}</h1>
      <p className="mt-2 text-gray-600">{meta.description}</p>
      <p className="mt-8 text-gray-500">This tool is coming soon.</p>
      <Link href="/" className="mt-4 inline-block text-red-600 hover:underline">
        Back to all tools
      </Link>
    </div>
  );
}
