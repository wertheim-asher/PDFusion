import Link from "next/link";
import { Logo } from "@/components/Logo";
import { TOOLS } from "@/lib/tools";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1>
            <Logo iconClassName="h-8 w-8" textClassName="text-2xl" />
          </h1>
          <p className="mt-2 text-gray-600">
            Free PDF tools that run entirely in your browser. Your files never leave your device.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Object.entries(TOOLS).map(([slug, meta]) => (
            <Link
              key={slug}
              href={`/tools/${slug}`}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="font-semibold text-gray-900">{meta.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{meta.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
