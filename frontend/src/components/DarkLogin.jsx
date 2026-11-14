import React, { useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Keyframes live here so no tailwind.config changes are needed.       */
/* ------------------------------------------------------------------ */
const styles = `
@keyframes dl-rise {
  from { opacity: 0; transform: translate3d(0, 22px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes dl-cell {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes dl-grid-move {
  from { background-position: 0 0; }
  to   { background-position: 0 56px; }
}
@keyframes dl-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}
@keyframes dl-drift {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50%      { transform: translate3d(30px, -24px, 0); }
}

.dl-rise  { opacity: 0; animation: dl-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.dl-cell  { opacity: 0; animation: dl-cell 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.dl-grid  { animation: dl-grid-move 3s linear infinite; }
.dl-pulse { animation: dl-pulse 3s ease-in-out infinite; }
.dl-drift { animation: dl-drift 14s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .dl-rise, .dl-cell { opacity: 1; animation: none; }
  .dl-grid, .dl-pulse, .dl-drift { animation: none; }
}
`;

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */
function GithubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.5-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 .1.75 2.28 3.03 1.72.1-.72.4-1.22.7-1.5-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.13-1.45 3.08-1.15 3.08-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.33-2.64 5.28-5.15 5.56.4.35.75 1.03.75 2.08v3.1c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Cursor glare (used on the preview card and the sign-in card)        */
/* ------------------------------------------------------------------ */
function useGlare({ tilt = 0 } = {}) {
  const ref = useRef(null);

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    if (tilt) {
      el.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * tilt}deg) rotateY(${(x - 0.5) * tilt * 1.2}deg)`;
    }
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (el && tilt) {
      el.style.transform =
        "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    }
  };

  return { ref, onMouseMove, onMouseLeave };
}

function Glare({ color }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{
        background: `radial-gradient(340px circle at var(--mx, 50%) var(--my, 50%), ${color}, transparent 60%)`,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Preview card with a contribution grid                               */
/* ------------------------------------------------------------------ */
const WEEKS = 16;

const activityColors = [
  "bg-white/10",
  "bg-indigo-400/40",
  "bg-indigo-400/60",
  "bg-violet-400/70",
  "bg-teal-400",
];

// Stable sample data so the preview looks the same on every render.
const activity = Array.from({ length: WEEKS * 7 }, (_, n) => {
  const col = Math.floor(n / 7);
  const row = n % 7;
  const x = Math.sin((col + 1) * 12.9898 + (row + 1) * 78.233) * 43758.5453;
  let f = x - Math.floor(x);
  if (row === 0 || row === 6) f *= 0.55; // quieter weekends
  const level = f > 0.88 ? 4 : f > 0.7 ? 3 : f > 0.5 ? 2 : f > 0.3 ? 1 : 0;
  return { col, level };
});

function DashboardPreview() {
  const glare = useGlare({ tilt: 5 });

  return (
    <div
      {...glare}
      className="group relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80 p-4 text-slate-100 shadow-2xl shadow-black/30 backdrop-blur transition-[transform,border-color] duration-200 ease-out will-change-transform hover:border-teal-300/40 sm:p-6"
    >
      <Glare color="rgba(94,234,212,0.14)" />

      <div className="relative">
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rose-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-teal-400" />
          </div>
          <span className="font-mono text-xs opacity-60">
            devcollab / preview
          </span>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-teal-400">
              Workspace preview
            </p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">
              Your overview
            </h2>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold text-indigo-300">
            Sample
          </span>
        </div>

        <p className="mb-5 text-xs leading-5 opacity-60">
          An illustration of the insights and collaboration tools DevCollab is
          designed to bring together.
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 p-3 transition duration-200 hover:border-indigo-400/50 hover:bg-white/[0.03]">
            <div className="mb-2 flex items-center gap-2 text-xs opacity-60">
              <span className="size-2 rounded-full bg-indigo-500" />
              Repositories
            </div>
            <p className="text-xl font-bold">Explore</p>
            <p className="mt-1 text-[11px] opacity-50">Connected projects</p>
          </div>

          <div className="rounded-xl border border-white/10 p-3 transition duration-200 hover:border-teal-400/50 hover:bg-white/[0.03]">
            <div className="mb-2 flex items-center gap-2 text-xs opacity-60">
              <span className="size-2 rounded-full bg-teal-500" />
              Collaboration
            </div>
            <p className="text-xl font-bold">Together</p>
            <p className="mt-1 text-[11px] opacity-50">
              Issues and pull requests
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-3 sm:p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold">Contribution activity</p>
            <span className="text-[11px] opacity-50">Illustrative</span>
          </div>

          <div
            className="grid grid-flow-col grid-rows-7 gap-1"
            style={{ gridAutoColumns: "1fr" }}
            aria-hidden="true"
          >
            {activity.map((c, i) => (
              <span
                key={i}
                className={`dl-cell aspect-square rounded-[3px] ${activityColors[c.level]}`}
                style={{ animationDelay: `${0.9 + c.col * 0.035}s` }}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] opacity-60">
            <span>Less</span>
            {activityColors.map((c) => (
              <span key={c} className={`size-2.5 rounded-[3px] ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] opacity-60">
          <span className="flex items-center gap-2">
            <span className="dl-pulse size-2 rounded-full bg-teal-400" />
            GitHub-powered workspace
          </span>
          <span>Connect to get started</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
function DarkLogin({ onToggleTheme }) {
  const [loading, setLoading] = useState(false);
  const cardGlare = useGlare();

  const handleGithubLogin = () => {
    if (loading) return;
    setLoading(true);
    window.location.href = "/api/auth/github";
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <style>{styles}</style>

      <div className="grid min-h-screen md:grid-cols-2">
        {/* ---------------------------- left ---------------------------- */}
        <section className="relative flex min-h-[440px] flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 px-6 py-7 text-white sm:px-10 md:min-h-screen md:px-8 lg:px-12 xl:px-16">
          {/* ambient glows */}
          <div className="dl-drift pointer-events-none absolute -right-32 top-20 size-96 rounded-full bg-violet-400/20 blur-3xl" />
          <div
            className="dl-drift pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-teal-400/15 blur-3xl"
            style={{ animationDelay: "-7s" }}
          />

          {/* perspective grid floor */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%]"
            style={{
              perspective: "500px",
              maskImage: "linear-gradient(to top, black 10%, transparent 90%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 10%, transparent 90%)",
            }}
            aria-hidden="true"
          >
            <div
              className="dl-grid absolute -inset-x-1/2 bottom-0 h-[200%] origin-bottom"
              style={{
                transform: "rotateX(62deg)",
                backgroundSize: "56px 56px",
                backgroundImage:
                  "linear-gradient(to right, rgba(129,140,248,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(129,140,248,0.2) 1px, transparent 1px)",
              }}
            />
          </div>

          <a
            href="/"
            className="dl-rise relative z-10 flex w-fit items-center gap-3 rounded-lg text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500"
            style={{ animationDelay: "0.05s" }}
            aria-label="DevCollab home"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-white text-lg font-extrabold text-indigo-700 shadow-lg shadow-indigo-500/30">
              D
            </span>
            DevCollab
          </a>

          <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12 md:py-10">
            <div
              className="dl-rise mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-indigo-50 backdrop-blur"
              style={{ animationDelay: "0.15s" }}
            >
              <span className="dl-pulse size-2 rounded-full bg-teal-300" />
              A connected workspace for developers
            </div>

            <h1
              className="dl-rise max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl xl:text-6xl"
              style={{ animationDelay: "0.25s" }}
            >
              Your GitHub workflow.
              <span className="mt-1 block bg-gradient-to-r from-teal-200 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
                One connected workspace.
              </span>
            </h1>

            <p
              className="dl-rise mt-5 max-w-lg text-sm leading-7 text-indigo-100 sm:text-base"
              style={{ animationDelay: "0.35s" }}
            >
              Bring repositories, issues, pull requests and developer insights
              together. Make collaboration simpler and understand your team's
              development activity.
            </p>

            <div
              className="dl-rise mt-10 hidden md:block"
              style={{ animationDelay: "0.5s" }}
            >
              <DashboardPreview />
            </div>

            <p
              className="dl-rise mt-8 text-xs text-indigo-100/70"
              style={{ animationDelay: "0.6s" }}
            >
              Built for individual developers, teams and open-source
              contributors.
            </p>
          </div>

          <div className="relative z-10 hidden items-center justify-between border-t border-white/15 pt-5 text-xs text-indigo-100/70 md:flex">
            <span>© {new Date().getFullYear()} DevCollab</span>
            <span>Made for people who build things.</span>
          </div>
        </section>

        {/* ---------------------------- right --------------------------- */}
        <section className="relative flex min-h-[560px] flex-col overflow-hidden px-6 py-6 sm:px-10 md:min-h-screen md:px-8 lg:px-12 xl:px-16">
          <div className="pointer-events-none absolute -right-24 top-1/3 size-80 rounded-full bg-indigo-600/10 blur-3xl" />

          <div
            className="dl-rise relative flex items-center justify-end"
            style={{ animationDelay: "0.1s" }}
          >
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Switch to light theme"
              className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <SunIcon />
              <span className="hidden sm:inline">Light mode</span>
            </button>
          </div>

          <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
            <div
              {...cardGlare}
              className="dl-rise group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-black/30 backdrop-blur transition-colors duration-300 hover:border-indigo-400/40 sm:p-9"
              style={{ animationDelay: "0.3s" }}
            >
              <Glare color="rgba(129,140,248,0.14)" />

              <div className="relative">
                <div className="mb-8">
                  <p className="mb-3 text-sm font-semibold text-indigo-400">
                    Welcome back
                  </p>

                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    Welcome to DevCollab
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Sign in securely using your GitHub account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGithubLogin}
                  disabled={loading}
                  aria-busy={loading}
                  className="group/btn relative flex min-h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 active:translate-y-0 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0"
                >
                  {/* shine sweep */}
                  <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/20 opacity-0 transition-all duration-700 group-hover/btn:left-full group-hover/btn:opacity-100" />
                  <span className="relative flex items-center gap-3">
                    {loading ? <Spinner /> : <GithubIcon />}
                    {loading ? "Redirecting to GitHub" : "Continue with GitHub"}
                  </span>
                </button>

                <div className="my-7 flex items-center gap-4">
                  <span className="h-px flex-1 bg-slate-700" />
                  <span className="text-xs text-slate-400">
                    Secure authentication
                  </span>
                  <span className="h-px flex-1 bg-slate-700" />
                </div>

                <div className="rounded-xl border border-white/5 bg-slate-800/70 p-4 text-sm leading-6 text-slate-300 transition duration-200 hover:border-teal-400/30">
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <span className="grid size-5 place-items-center rounded-full bg-teal-400/15 text-xs text-teal-300">
                      ✓
                    </span>
                    Your account, your permissions
                  </div>
                  Sign in with GitHub first. Repository access is managed
                  separately through the DevCollab GitHub App.
                </div>

                <p className="mt-7 text-center text-xs leading-6 text-slate-400">
                  By continuing, you agree to our{" "}
                  <a
                    href="/terms"
                    className="font-semibold text-indigo-400 underline-offset-4 transition hover:text-indigo-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="font-semibold text-indigo-400 underline-offset-4 transition hover:text-indigo-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>

            <p
              className="dl-rise mt-6 text-center text-xs text-slate-400"
              style={{ animationDelay: "0.45s" }}
            >
              No email or password required. Sign in with GitHub.
            </p>
          </div>

          <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-400 md:hidden">
            © {new Date().getFullYear()} DevCollab
          </div>
        </section>
      </div>
    </main>
  );
}

export default DarkLogin;