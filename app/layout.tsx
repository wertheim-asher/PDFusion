import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";

// Display face for headings and buttons; Figtree for body text and form
// fields. Both are variable fonts, self-hosted by next/font at build time, so
// the browser never contacts Google.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDFusion — free, private PDF editing in your browser",
  description:
    "Merge, split, compress, convert, watermark, and password-protect PDFs. Everything runs locally in your browser — your files are never uploaded anywhere.",
};

export const viewport: Viewport = {
  themeColor: "#f6f0e4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${figtree.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
