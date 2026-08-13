import Link from "next/link";

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-red-600">
            ← All PDF Tools
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
