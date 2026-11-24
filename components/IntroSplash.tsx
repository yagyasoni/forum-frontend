import Logo from "./Logo";

// One of these is shown under the logo, a different one on each visit.
const LINES = [
  "Loading audit answers…",
  "Checking reject codes…",
  "Gathering pharmacists…",
  "Pulling the latest threads…",
  "Opening the audit desk…",
  "Counting the invoices…",
];

// Runs before the first paint. If this tab has already seen the intro it marks <html> so the CSS
// hides it; otherwise it picks the next line. No React state is involved, so there is nothing to
// hydrate and the intro cannot delay the page.
const SCRIPT = `try{var d=document.documentElement;if(sessionStorage.getItem("forum_intro_seen")){d.dataset.intro="seen"}else{sessionStorage.setItem("forum_intro_seen","1");var l=${JSON.stringify(
  LINES,
)},i=(parseInt(localStorage.getItem("forum_intro_i")||"-1",10)+1)%l.length;localStorage.setItem("forum_intro_i",String(i));d.style.setProperty("--intro-line",JSON.stringify(l[i]))}}catch(e){}`;

/**
 * The short branded intro shown once per visit, on the first page load only: logo, a line that
 * changes each visit, and a bar that fills in about a second. It fades itself out with CSS
 * (see .intro-splash in app/globals.css), so it works the same with or without JavaScript.
 */
export default function IntroSplash() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
      <div className="intro-splash" aria-hidden>
        <div className="intro-mark">
          <Logo size={56} />
        </div>
        <p className="mt-4 text-lg font-semibold tracking-tight">AuditProRx</p>
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted uppercase">Community</p>
        <p className="intro-line mt-5 h-5 text-sm text-muted" />
        <div className="intro-bar mt-3">
          <span />
        </div>
      </div>
    </>
  );
}
