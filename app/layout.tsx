import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import IntroSplash from "@/components/IntroSplash";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import RightRail from "@/components/RightRail";
import { SignInProvider } from "@/components/SignInDialog";
import { MemberProvider } from "@/lib/member";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  // Lets every page use relative URLs for canonical links and previews.
  metadataBase: new URL(SITE_URL),
  title: { default: "AuditProRx Community", template: "%s · AuditProRx Community" },
  description:
    "A community for independent pharmacy owners, pharmacists, and technicians: PBM audits, claims and rejections, inventory, and compliance.",
  // Link previews on WhatsApp, LinkedIn, X and Slack. The image comes from app/opengraph-image.tsx.
  openGraph: { siteName: SITE_NAME, locale: "en_US", type: "website" },
  twitter: { card: "summary_large_image" },
};

/** One layout for every page: top bar, left nav, content, right rail, footer. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning // the intro script marks <html> before React loads
    >
      <body className="flex min-h-full flex-col bg-bg font-sans text-fg">
        <IntroSplash />
        <MemberProvider>
        <SignInProvider>
          <TopBar />

          {/*
            Two nested rows. The inner row holds the sidebar and the content and is exactly as tall as
            the content (self-start), so the sidebar can end where the thread list ends. The right rail
            sits outside it and can never stretch that row. The footer's mt-auto keeps it at the bottom
            on short pages.
          */}
          <div className="mx-auto flex w-full max-w-7xl px-4 py-4 sm:py-5 xl:gap-8">
            <div className="flex min-w-0 flex-1 gap-6 self-start xl:gap-8">
              {/* The side columns read the URL and the API, so they stream in behind Suspense. */}
              <Suspense fallback={<aside className="hidden w-60 shrink-0 md:block" />}>
                <Sidebar />
              </Suspense>
              <main className="min-w-0 flex-1">{children}</main>
            </div>
            <Suspense fallback={<aside className="hidden w-72 shrink-0 xl:block" />}>
              <RightRail />
            </Suspense>
          </div>

          {/* Fixed height: the sidebar's sticky box is sized against it (see components/Sidebar.tsx). */}
          <footer className="mt-auto h-14 border-t border-line">
            <div className="mx-auto flex h-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-muted">
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
        </MemberProvider>
      </body>
    </html>
  );
}
