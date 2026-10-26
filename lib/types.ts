// Shapes shared by the API client, the mock data, and every component.
// They match the JSON the forum-backend returns.

export type Tab = "latest" | "top" | "unanswered";

export type Role = "owner" | "pharmacist" | "technician" | "consultant" | "student";

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Pharmacy Owner",
  pharmacist: "Pharmacist",
  technician: "Technician",
  consultant: "Consultant",
  student: "Student",
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  threadCount: number;
};

export type Author = {
  username: string;
  role: Role;
  verified: boolean; // true when the AuditProRx account has a pharmacy on file
};

export type ThreadRow = {
  id: string;
  title: string;
  excerpt: string; // first ~180 characters of the body as plain text
  imageUrl?: string; // optional picture attached to the post
  category: Pick<Category, "slug" | "name">;
  author: Author;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  lastActivityAt: string; // ISO date
  createdAt: string; // ISO date
};

export type Comment = {
  id: string;
  author: Author;
  body: string; // sanitized HTML
  likeCount: number;
  createdAt: string;
};

export type ThreadDetail = {
  thread: ThreadRow & { body: string }; // sanitized HTML
  comments: Comment[];
};

export type ThreadQuery = {
  tab: Tab;
  category?: string; // category slug
  q?: string; // search text
  page: number;
};

export type ThreadPage = {
  items: ThreadRow[];
  page: number;
  pageSize: number;
  total: number; // all matching threads, for the pagination bar
  hasMore: boolean;
};

export type LookupInput = { bin?: string; pcn?: string; group?: string };

export type LookupMatch = {
  bin: string;
  pcn: string;
  group: string;
  pbmName: string;
  payerType: string;
};
