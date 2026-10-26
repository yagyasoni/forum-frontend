import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import RightRail from "@/components/RightRail";
import { SignInProvider } from "@/components/SignInDialog";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "AuditProRx Community", template: "%s · AuditProRx Community" },
  description:
    "A community for independent pharmacy owners, pharmacists, and technicians: PBM audits, claims and rejections, inventory, and compliance.",
};

/** One layout for every page: top bar, left nav, content, right rail, footer. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg font-sans text-fg">
        <SignInProvider>
          <TopBar />

          <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-4 sm:py-5 xl:gap-8">
            {/* The side columns read the URL and the API, so they stream in behind Suspense. */}
            <Suspense fallback={<aside className="hidden w-60 shrink-0 md:block" />}>
              <Sidebar />
            </Suspense>
            <main className="min-w-0 flex-1">{children}</main>
            <Suspense fallback={<aside className="hidden w-72 shrink-0 xl:block" />}>
              <RightRail />
            </Suspense>
          </div>

          <footer className="border-t border-line">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted">
              <p>© AuditProRx. Community forum for independent pharmacies.</p>
              <nav className="flex gap-4">
                <a href="https://www.auditprorx.com" target="_blank" rel="noreferrer" className="hover:text-fg">
                  auditprorx.com
                </a>
                <a href="https://www.auditprorx.com/privacy-policy" target="_blank" rel="noreferrer" className="hover:text-fg">
                  Privacy
                </a>
                <a href="https://www.auditprorx.com/terms-of-service" target="_blank" rel="noreferrer" className="hover:text-fg">
                  Terms
                </a>
              </nav>
            </div>
          </footer>
        </SignInProvider>
      </body>
    </html>
  );
}
