// Sample content for the member prototype. Nothing here comes from the backend.
// It is replaced by real API data when the member endpoints exist.

import type { Author, Category, ThreadDetail } from "./types";

/** Categories only signed-in members can open. Visitors never see them. */
export const MEMBER_CATEGORIES: Category[] = [
  { id: "m-how-to", slug: "how-to", name: "How To", description: "Step-by-step guides from the AuditProRx team.", threadCount: 2 },
  { id: "m-announcements", slug: "announcements", name: "Announcements", description: "News from AuditProRx.", threadCount: 2 },
];

export const isMemberCategory = (slug?: string | null) => MEMBER_CATEGORIES.some((c) => c.slug === slug);

/** Ids that exist only in the prototype (sample member threads and threads posted in this browser). */
export const isPrototypeId = (id: string) => id.startsWith("m-") || id.startsWith("local-");

const TEAM: Author = { username: "auditprorx_team", role: "consultant", verified: true };
const OHIO: Author = { username: "pharmd_ohio", role: "pharmacist", verified: true };
const TECH: Author = { username: "techlife22", role: "technician", verified: false };

/** Who "replies" to a new post in the prototype so the notification bell has something to show. */
export const DEMO_REPLIER = OHIO;
export const DEMO_REPLY =
  "<p>Good question. We had the same thing last quarter. Send the line-item invoices with a short cover note and keep the fax confirmation.</p>";

const HOW_TO = { slug: "how-to", name: "How To" };
const NEWS = { slug: "announcements", name: "Announcements" };

export const MEMBER_THREADS: ThreadDetail[] = [
  {
    thread: {
      id: "m-howto-1",
      title: "How to answer a desk audit letter in five steps",
      excerpt:
        "Read the claim list, pull the invoice-to-dispense report for the audit window, attach line-item invoices, add a cover sheet, and send before the due date.",
      body: "<p>A short checklist for a first desk audit.</p><ol><li>Read the claim list and note the audit window.</li><li>Pull the invoice-to-dispense report for that window.</li><li>Attach the line-item invoices it references.</li><li>Add a cover sheet with your NCPDP, NPI, and contact.</li><li>Send before the due date and keep the confirmation.</li></ol>",
      category: HOW_TO,
      author: TEAM,
      isPinned: true,
      isLocked: false,
      viewCount: 340,
      commentCount: 1,
      likeCount: 18,
      createdAt: "2026-11-10T09:00:00Z",
      lastActivityAt: "2026-11-12T15:20:00Z",
    },
    comments: [
      { id: "m-howto-1-c1", author: OHIO, body: "<p>Step 3 is the one that saves you. Summaries get sent back.</p>", likeCount: 5, createdAt: "2026-11-12T15:20:00Z" },
    ],
  },
  {
    thread: {
      id: "m-howto-2",
      title: "How to read a reject code before calling the help desk",
      excerpt:
        "Most rejects tell you what to fix. A quick guide to the ten codes that make up the bulk of rejected claims and what each one is asking for.",
      body: "<p>Most rejects tell you what to fix. Check the code, then the message text, then the plan's payer sheet.</p><p>The common ones: 70 (not covered), 75 (prior auth), 76 (plan limits), 79 (refill too soon), 88 (DUR).</p>",
      category: HOW_TO,
      author: TEAM,
      isPinned: false,
      isLocked: false,
      viewCount: 205,
      commentCount: 1,
      likeCount: 11,
      createdAt: "2026-11-06T10:30:00Z",
      lastActivityAt: "2026-11-08T12:00:00Z",
    },
    comments: [
      { id: "m-howto-2-c1", author: TECH, body: "<p>Printing this for the bench. Thank you.</p>", likeCount: 2, createdAt: "2026-11-08T12:00:00Z" },
    ],
  },
  {
    thread: {
      id: "m-news-1",
      title: "Member sign-in is here: post, comment, and save threads",
      excerpt:
        "You can now sign in with your AuditProRx account or with Google. Pick a username once, then post questions, reply, and save threads to read later.",
      body: "<p>You can now sign in with your AuditProRx account or with Google.</p><p>Pick a username once, then post questions, reply to others, and save threads to read later.</p>",
      category: NEWS,
      author: TEAM,
      isPinned: true,
      isLocked: true,
      viewCount: 512,
      commentCount: 0,
      likeCount: 24,
      createdAt: "2026-11-14T08:00:00Z",
      lastActivityAt: "2026-11-14T08:00:00Z",
    },
    comments: [],
  },
  {
    thread: {
      id: "m-news-2",
      title: "Payer lookup now covers more Medicaid managed care plans",
      excerpt:
        "The BIN, PCN, and Group lookup on the home page has been updated with more Medicaid managed care plans across several states.",
      body: "<p>The BIN, PCN, and Group lookup on the home page has been updated with more Medicaid managed care plans.</p>",
      category: NEWS,
      author: TEAM,
      isPinned: false,
      isLocked: true,
      viewCount: 298,
      commentCount: 0,
      likeCount: 9,
      createdAt: "2026-11-03T08:00:00Z",
      lastActivityAt: "2026-11-03T08:00:00Z",
    },
    comments: [],
  },
];
