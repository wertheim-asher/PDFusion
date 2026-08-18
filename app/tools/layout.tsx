import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link href="/" className="inline-block opacity-90 hover:opacity-100">
            <Logo iconClassName="h-6 w-6" textClassName="text-lg" />
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
