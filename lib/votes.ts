// Visitor voting identity and the device's own votes, kept in the browser.
// The server records every vote under the voter id; the local copy only drives the arrow state
// on page load without an extra request. Both are per browser until accounts arrive.

const VOTER_KEY = "forum_voter_id";
const VOTES_KEY = "forum_votes";

export type VoteValue = 1 | -1 | 0;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage blocked (private mode): voting still works for this page view
  }
}

/** A random id for this browser, created on first use. */
export function getVoterId(): string {
  let id = read(VOTER_KEY);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "");
    write(VOTER_KEY, id);
  }
  return id;
}

function readVotes(): Record<string, VoteValue> {
  try {
    return JSON.parse(read(VOTES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getLocalVote(threadId: string): VoteValue {
  return readVotes()[threadId] ?? 0;
}

export function setLocalVote(threadId: string, value: VoteValue) {
  const votes = readVotes();
  if (value === 0) delete votes[threadId];
  else votes[threadId] = value;
  write(VOTES_KEY, JSON.stringify(votes));
  window.dispatchEvent(new Event(CHANGE_EVENT)); // every vote box on the page re-reads
}

/** Forget the arrows shown in this browser (used on sign-out: they were the member's votes). */
export function clearLocalVotes() {
  write(VOTES_KEY, "{}");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const CHANGE_EVENT = "forum-votes-change";

/** For useSyncExternalStore: re-render when a vote changes here or in another tab. */
export function subscribeVotes(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
