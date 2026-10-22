import {
  Combine,
  Crop,
  Droplets,
  FileImage,
  Hash,
  ImageDown,
  LayoutGrid,
  Lock,
  LockOpen,
  RotateCw,
  Scissors,
  Shrink,
  type LucideIcon,
} from "lucide-react";
import type { ToolSlug } from "@/lib/tools";

const ICONS: Record<ToolSlug, LucideIcon> = {
  "merge-pdf": Combine,
  "split-pdf": Scissors,
  "organize-pdf": LayoutGrid,
  "rotate-pdf": RotateCw,
  "compress-pdf": Shrink,
  "crop-pdf": Crop,
  "pdf-to-jpg": ImageDown,
  "jpg-to-pdf": FileImage,
  "watermark-pdf": Droplets,
  "page-numbers-pdf": Hash,
  "protect-pdf": Lock,
  "unlock-pdf": LockOpen,
};

export function ToolIcon({ tool, className = "h-5 w-5" }: { tool: ToolSlug; className?: string }) {
  const Icon = ICONS[tool];
  return <Icon className={className} strokeWidth={2.25} aria-hidden="true" />;
}
