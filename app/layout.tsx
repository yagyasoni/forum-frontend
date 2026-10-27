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

          {/*
            Grid: the two side columns share row 1 and the content spans rows 1 and 2.
            So the left column is as tall as the right rail, and its last card can sit on the same
            baseline as the right rail's last card.
          */}
          <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-4 sm:py-5 md:grid-cols-[15rem_minmax(0,1fr)] md:grid-rows-[auto_1fr] xl:grid-cols-[15rem_minmax(0,1fr)_18rem] xl:gap-8">
            {/* The side columns read the URL and the API, so they stream in behind Suspense. */}
            <Suspense fallback={<aside className="hidden md:block" />}>
              <Sidebar />
            </Suspense>
            <main className="min-w-0 md:row-span-2">{children}</main>
            <Suspense fallback={<aside className="hidden xl:block" />}>
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
