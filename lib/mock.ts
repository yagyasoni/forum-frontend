// Sample data for the visitor prototype. Used only when NEXT_PUBLIC_USE_MOCK=true.
// The functions at the bottom apply the same rules the backend will:
// visitors never see members-only categories or deleted threads.

import type {
  Author,
  Category,
  Comment,
  LookupInput,
  LookupMatch,
  ThreadDetail,
  ThreadPage,
  ThreadQuery,
  ThreadRow,
} from "./types";

const PAGE_SIZE = 8;

type MockCategory = Category & { membersOnly: boolean };

const CATEGORIES: MockCategory[] = [
  { id: "c1", slug: "pbm-audits", name: "PBM Audits", description: "Desk audits, on-site audits, appeals, recoupments, and dealing with specific PBMs.", threadCount: 0, membersOnly: false },
  { id: "c2", slug: "claims-and-rejections", name: "Claims and Rejections", description: "Rejected claims, reject codes, BIN and PCN questions, prior auths, and billing fixes.", threadCount: 0, membersOnly: false },
  { id: "c3", slug: "inventory-and-wholesalers", name: "Inventory and Wholesalers", description: "Invoices, shortages, reconciliation, and wholesaler accounts.", threadCount: 0, membersOnly: false },
  { id: "c4", slug: "compliance-and-licensing", name: "Compliance and Licensing", description: "DEA, state license renewals, CMEA, temperature logs, inspections, and record keeping.", threadCount: 0, membersOnly: false },
  { id: "c5", slug: "general-discussion", name: "General Discussion", description: "Everything else about running a pharmacy.", threadCount: 0, membersOnly: false },
  { id: "c6", slug: "announcements", name: "Announcements", description: "News from AuditProRx.", threadCount: 0, membersOnly: true },
];

const AUTHORS: Record<string, Author> = {
  rxowner_nj: { username: "rxowner_nj", role: "owner", verified: true },
  techlife22: { username: "techlife22", role: "technician", verified: false },
  pharmd_ohio: { username: "pharmd_ohio", role: "pharmacist", verified: true },
  consult_mike: { username: "consult_mike", role: "consultant", verified: false },
};

type MockThread = Omit<ThreadRow, "category" | "author" | "commentCount" | "excerpt"> & {
  categorySlug: string;
  authorKey: keyof typeof AUTHORS;
  body: string;
  comments: Array<{ authorKey: keyof typeof AUTHORS; body: string; likeCount: number; createdAt: string }>;
};

const THREADS: MockThread[] = [
  {
    id: "t1",
    categorySlug: "pbm-audits",
    authorKey: "rxowner_nj",
    imageUrl: "/mock/audit-letter.svg",
    title: "Caremark desk audit asking for 2023 invoices, what do they actually accept?",
    body: "<p>Got a desk audit letter from Caremark covering 40 claims from 2023. They want purchase records for every NDC on the list.</p><p>We buy from McKesson and a secondary. Is a wholesaler invoice summary enough, or do they want the line-item invoice for each date? Trying not to send more than they need.</p>",
    isPinned: true,
    isLocked: false,
    viewCount: 212,
    likeCount: 9,
    createdAt: "2026-10-19T09:30:00Z",
    lastActivityAt: "2026-10-22T14:02:00Z",
    comments: [
      { authorKey: "consult_mike", body: "<p>Line-item invoices, always. A summary gets kicked back and you lose two weeks. Pull the invoice-to-dispense report for the audit window and attach the invoices it references.</p>", likeCount: 6, createdAt: "2026-10-19T11:10:00Z" },
      { authorKey: "pharmd_ohio", body: "<p>Same experience here. Also include the secondary wholesaler's DEA and license on the cover page or they question the source.</p>", likeCount: 3, createdAt: "2026-10-20T08:45:00Z" },
      { authorKey: "rxowner_nj", body: "<p>Thanks both. Sending line items with a cover sheet this week.</p>", likeCount: 1, createdAt: "2026-10-22T14:02:00Z" },
    ],
  },
  {
    id: "t2",
    categorySlug: "claims-and-rejections",
    authorKey: "techlife22",
    imageUrl: "/mock/rejection.svg",
    title: "BIN 610014 rejecting with 75 Prior Auth on a refill that went through last month",
    body: "<p>Patient's Eliquis refill rejected today with 75 Prior Authorization Required. Same BIN, same PCN, same group as the fill on September 20 which paid fine.</p><p>Nothing changed on our end. Plan year rollover maybe? Anyone seeing this on Express Scripts Medicare plans this month?</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 98,
    likeCount: 3,
    createdAt: "2026-10-22T10:05:00Z",
    lastActivityAt: "2026-10-22T11:30:00Z",
    comments: [
      { authorKey: "pharmd_ohio", body: "<p>Seeing it too. Formulary tier change on October 1 for a few DOACs. Call the help desk, they can backdate the PA if the patient was already stable on it.</p>", likeCount: 4, createdAt: "2026-10-22T10:40:00Z" },
      { authorKey: "techlife22", body: "<p>Called, they confirmed the tier change. PA submitted through CoverMyMeds, waiting.</p>", likeCount: 0, createdAt: "2026-10-22T11:30:00Z" },
    ],
  },
  {
    id: "t3",
    categorySlug: "inventory-and-wholesalers",
    authorKey: "pharmd_ohio",
    imageUrl: "/mock/invoice.svg",
    title: "McKesson invoice shows 3 bottles, we received 2. How do you document the short?",
    body: "<p>Tote arrived sealed, packing slip says 3 bottles of metformin 500 #500, only 2 in the tote. Called and they issued a credit, but what are you keeping on file so it does not look like a dispensing gap during an audit?</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 41,
    likeCount: 2,
    createdAt: "2026-10-21T16:20:00Z",
    lastActivityAt: "2026-10-21T16:20:00Z",
    comments: [],
  },
  {
    id: "t4",
    categorySlug: "compliance-and-licensing",
    authorKey: "consult_mike",
    title: "DEA renewal timeline: how early are you submitting now?",
    body: "<p>Renewals used to clear in two weeks. Two of my clients waited six weeks this summer and one had a gap. Are people submitting at 90 days now, or earlier?</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 77,
    likeCount: 5,
    createdAt: "2026-10-18T13:00:00Z",
    lastActivityAt: "2026-10-21T09:15:00Z",
    comments: [
      { authorKey: "rxowner_nj", body: "<p>We submit the day the 90-day window opens and keep the confirmation email printed next to the certificate. Had no issues since.</p>", likeCount: 2, createdAt: "2026-10-21T09:15:00Z" },
    ],
  },
  {
    id: "t5",
    categorySlug: "general-discussion",
    authorKey: "rxowner_nj",
    title: "Anyone switched from PrimeRx to PioneerRx this year? Honest take?",
    body: "<p>Thinking about it for 2027. Main pain points today are reporting and the workflow queue. Would like to hear from stores that actually made the move, not sales reps.</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 160,
    likeCount: 7,
    createdAt: "2026-10-17T18:40:00Z",
    lastActivityAt: "2026-10-20T20:05:00Z",
    comments: [
      { authorKey: "techlife22", body: "<p>Switched in March. Queue is much better. Data migration took three weekends and we lost some old notes. Would still do it again.</p>", likeCount: 5, createdAt: "2026-10-18T07:30:00Z" },
      { authorKey: "pharmd_ohio", body: "<p>Reporting is the big win. Budget a month of double-checking inventory counts after cutover.</p>", likeCount: 3, createdAt: "2026-10-20T20:05:00Z" },
    ],
  },
  {
    id: "t6",
    categorySlug: "pbm-audits",
    authorKey: "pharmd_ohio",
    title: "Express Scripts recouped on a quantity exceeds days supply flag for an inhaler",
    body: "<p>Symbicort, 1 inhaler, billed as 30 days. ESI says the labeled dose makes it a 60-day supply and recouped the full claim. We appealed with the prescriber's sig. Anyone won this one?</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 134,
    likeCount: 12,
    createdAt: "2026-10-16T15:10:00Z",
    lastActivityAt: "2026-10-20T12:50:00Z",
    comments: [
      { authorKey: "consult_mike", body: "<p>Yes, twice. Attach the sig, the manufacturer's actuation count, and the math. Days supply has to match the prescriber's directions, not the label.</p>", likeCount: 8, createdAt: "2026-10-17T09:00:00Z" },
      { authorKey: "rxowner_nj", body: "<p>Also check the fill history. If earlier fills were 30 days with the same sig they usually reverse.</p>", likeCount: 2, createdAt: "2026-10-20T12:50:00Z" },
    ],
  },
  {
    id: "t7",
    categorySlug: "claims-and-rejections",
    authorKey: "consult_mike",
    title: "Reject 79 Refill Too Soon on a vacation override, which codes are you using?",
    body: "<p>Patient leaving the country for six weeks. Plan allows one vacation override per year but the claim keeps rejecting with 79. What submission clarification and prior auth type codes are working for you?</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 58,
    likeCount: 1,
    createdAt: "2026-10-20T08:20:00Z",
    lastActivityAt: "2026-10-20T10:00:00Z",
    comments: [
      { authorKey: "techlife22", body: "<p>Submission clarification code 03 with PA type 01 and the override number from the help desk in the PA field. Different PBMs want different fields, so call first.</p>", likeCount: 3, createdAt: "2026-10-20T10:00:00Z" },
    ],
  },
  {
    id: "t8",
    categorySlug: "inventory-and-wholesalers",
    authorKey: "techlife22",
    title: "Anda vs Kinray for generics this quarter, pricing moved a lot",
    body: "<p>Our secondary pricing on common generics jumped about 8% in October. Is anyone seeing Anda come in lower right now, or is it the same across the board?</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 23,
    likeCount: 0,
    createdAt: "2026-10-19T19:45:00Z",
    lastActivityAt: "2026-10-19T19:45:00Z",
    comments: [],
  },
  {
    id: "t9",
    categorySlug: "compliance-and-licensing",
    authorKey: "rxowner_nj",
    title: "Temperature log gaps during the power outage, what did your inspector want to see?",
    body: "<p>Lost power for nine hours last week. Fridge stayed in range on the data logger but the manual log has a gap. Inspection is due. What did your inspector accept as documentation?</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 88,
    likeCount: 4,
    createdAt: "2026-10-15T12:30:00Z",
    lastActivityAt: "2026-10-18T16:00:00Z",
    comments: [
      { authorKey: "pharmd_ohio", body: "<p>A printed data logger export for the window plus a short signed incident note was enough for ours. They mostly wanted to see that you noticed and checked the stock.</p>", likeCount: 4, createdAt: "2026-10-18T16:00:00Z" },
    ],
  },
  {
    id: "t10",
    categorySlug: "general-discussion",
    authorKey: "techlife22",
    title: "Tech-to-pharmacist ratio question for a busy independent store",
    body: "<p>We are at 350 scripts a day with one pharmacist and three techs. Owner wants to add a fourth tech. Does the state ratio count the cashier who also does data entry?</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 44,
    likeCount: 1,
    createdAt: "2026-10-14T14:00:00Z",
    lastActivityAt: "2026-10-16T09:20:00Z",
    comments: [
      { authorKey: "consult_mike", body: "<p>Depends on the state. In most, anyone touching the prescription record counts. Check your board's definition of technician duties before you add the fourth.</p>", likeCount: 2, createdAt: "2026-10-16T09:20:00Z" },
    ],
  },
  {
    id: "t11",
    categorySlug: "pbm-audits",
    authorKey: "consult_mike",
    title: "Optum on-site audit checklist, sharing what they pulled at our store",
    body: "<p>Had an Optum on-site last month. Posting the list so others can prep.</p><ul><li>Purchase invoices for 25 NDCs, 12 months back</li><li>Signature logs for 30 claims</li><li>Pharmacist license and DEA on the wall</li><li>Compound logs for two claims</li><li>Proof of delivery for every delivered claim in the sample</li></ul><p>Delivery proof was the one that hurt. Make sure your driver app exports by claim.</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 201,
    likeCount: 15,
    createdAt: "2026-10-12T10:00:00Z",
    lastActivityAt: "2026-10-20T07:40:00Z",
    comments: [
      { authorKey: "rxowner_nj", body: "<p>This is gold. Bookmarking for our next one.</p>", likeCount: 3, createdAt: "2026-10-12T15:25:00Z" },
      { authorKey: "pharmd_ohio", body: "<p>Can confirm the delivery proof piece. They disallowed four claims for us because the signature was a scribble with no date.</p>", likeCount: 5, createdAt: "2026-10-20T07:40:00Z" },
    ],
  },
  {
    id: "t12",
    categorySlug: "claims-and-rejections",
    authorKey: "pharmd_ohio",
    title: "Medicaid secondary paying $0 after Part D primary, is this a COB setup issue?",
    body: "<p>Dual eligible patient. Part D pays, then the Medicaid secondary returns paid $0 with no reject. Patient copay should be covered. Is this an other coverage code problem on our side or something the state has to fix?</p>",
    isPinned: false,
    isLocked: false,
    viewCount: 31,
    likeCount: 0,
    createdAt: "2026-10-13T11:15:00Z",
    lastActivityAt: "2026-10-13T11:15:00Z",
    comments: [],
  },
];

// Sample lookup rows. Real results come from the AuditProRx master sheet.
const LOOKUP_ROWS: LookupMatch[] = [
  { bin: "004336", pcn: "ADV", group: "RX0001", pbmName: "CVS Caremark", payerType: "Commercial" },
  { bin: "004336", pcn: "MEDDADV", group: "RX1234", pbmName: "CVS Caremark", payerType: "Medicare" },
  { bin: "610014", pcn: "MEDDPRIME", group: "", pbmName: "Express Scripts", payerType: "Medicare" },
  { bin: "003858", pcn: "A4", group: "", pbmName: "Express Scripts", payerType: "Commercial" },
  { bin: "610279", pcn: "MEDDAET", group: "", pbmName: "CVS Caremark", payerType: "Medicare" },
  { bin: "610084", pcn: "DRTXPROD", group: "NJMEDICAID", pbmName: "NJ Medicaid", payerType: "Medicaid" },
  { bin: "610502", pcn: "", group: "", pbmName: "Optum", payerType: "Commercial" },
];

// ---- helpers ---------------------------------------------------------------

const visibleCategories = CATEGORIES.filter((c) => !c.membersOnly);

/** Plain-text preview of an HTML body, the way the backend will compute it. */
function excerptOf(html: string, max = 180) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

function toRow(t: MockThread): ThreadRow {
  const category = CATEGORIES.find((c) => c.slug === t.categorySlug)!;
  return {
    id: t.id,
    title: t.title,
    excerpt: excerptOf(t.body),
    imageUrl: t.imageUrl,
    category: { slug: category.slug, name: category.name },
    author: AUTHORS[t.authorKey],
    isPinned: t.isPinned,
    isLocked: t.isLocked,
    viewCount: t.viewCount,
    commentCount: t.comments.length,
    likeCount: t.likeCount,
    lastActivityAt: t.lastActivityAt,
    createdAt: t.createdAt,
  };
}

const visibleThreads = THREADS.filter((t) => visibleCategories.some((c) => c.slug === t.categorySlug));

// ---- public functions, same signatures as the real API ----------------------

export function categories(): Category[] {
  return visibleCategories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    threadCount: visibleThreads.filter((t) => t.categorySlug === c.slug).length,
  }));
}

export function threads(query: ThreadQuery): ThreadPage {
  let rows = visibleThreads.map(toRow);

  if (query.category) rows = rows.filter((r) => r.category.slug === query.category);

  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((r) => {
      const body = THREADS.find((t) => t.id === r.id)!.body.toLowerCase();
      return r.title.toLowerCase().includes(q) || body.includes(q);
    });
  }

  if (query.tab === "top") {
    rows.sort((a, b) => b.likeCount - a.likeCount);
  } else if (query.tab === "unanswered") {
    rows = rows.filter((r) => r.commentCount === 0);
    rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } else {
    rows.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.lastActivityAt.localeCompare(a.lastActivityAt));
  }

  const start = (query.page - 1) * PAGE_SIZE;
  return {
    items: rows.slice(start, start + PAGE_SIZE),
    page: query.page,
    pageSize: PAGE_SIZE,
    total: rows.length,
    hasMore: start + PAGE_SIZE < rows.length,
  };
}

export function thread(id: string): ThreadDetail | null {
  const t = visibleThreads.find((x) => x.id === id);
  if (!t) return null;
  const comments: Comment[] = t.comments.map((c, i) => ({
    id: `${t.id}-c${i + 1}`,
    author: AUTHORS[c.authorKey],
    body: c.body,
    likeCount: c.likeCount,
    createdAt: c.createdAt,
  }));
  return { thread: { ...toRow(t), body: t.body }, comments };
}

export function lookup(input: LookupInput): LookupMatch[] {
  const norm = (v?: string) => (v ?? "").trim().toUpperCase();
  const bin = norm(input.bin);
  const pcn = norm(input.pcn);
  const group = norm(input.group);
  if (!bin && !pcn && !group) return [];
  return LOOKUP_ROWS.filter(
    (r) =>
      (!bin || r.bin === bin) &&
      (!pcn || r.pcn.toUpperCase() === pcn) &&
      (!group || r.group.toUpperCase() === group),
  );
}
