import React, { useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Keyframes live here so no tailwind.config changes are needed.       */
/* ------------------------------------------------------------------ */
const styles = `
@keyframes ll-rise {
  from { opacity: 0; transform: translate3d(0, 22px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}
@keyframes ll-cell {
  from { opacity: 0; transform: scale(0.4); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes ll-grid-move {
  from { background-position: 0 0; }
  to   { background-position: 0 56px; }
}
@keyframes ll-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}
@keyframes ll-drift {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50%      { transform: translate3d(30px, -24px, 0); }
}

.ll-rise  { opacity: 0; animation: ll-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.ll-cell  { opacity: 0; animation: ll-cell 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.ll-grid  { animation: ll-grid-move 3s linear infinite; }
.ll-pulse { animation: ll-pulse 3s ease-in-out infinite; }
.ll-drift { animation: ll-drift 14s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .ll-rise, .ll-cell { opacity: 1; animation: none; }
  .ll-grid, .ll-pulse, .ll-drift { animation: none; }
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

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.5 8.5 0 1 0 20.2 15.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
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
  "bg-slate-200",
  "bg-indigo-200",
  "bg-indigo-300",
  "bg-violet-400",
  "bg-teal-500",
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

function LightDashboardPreview() {
  const glare = useGlare({ tilt: 5 });

  return (
    <div
      {...glare}
      className="group relative mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/90 p-4 shadow-2xl shadow-indigo-900/[0.12] backdrop-blur-sm transition-[transform,border-color] duration-200 ease-out will-change-transform hover:border-indigo-300 sm:p-6"
    >
      <Glare color="rgba(99,102,241,0.12)" />

      <div className="relative">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rose-400" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="font-mono text-xs text-slate-400">
            devcollab / preview
          </span>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-indigo-600">
              Workspace preview
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              Your overview
            </h2>
          </div>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold text-indigo-700">
            Sample
          </span>
        </div>

        <p className="mb-5 text-xs leading-5 text-slate-500">
          An illustration of the insights and collaboration tools DevCollab is
          designed to bring together.
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50 to-white p-3 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-900/5">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
              <span className="size-2 rounded-full bg-indigo-500" />
              Repositories
            </div>
            <p className="text-xl font-bold text-slate-900">Explore</p>
            <p className="mt-1 text-[11px] text-slate-500">Connected projects</p>
          </div>

          <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-3 transition duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md hover:shadow-teal-900/5">
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
              <span className="size-2 rounded-full bg-teal-500" />
              Collaboration
            </div>
            <p className="text-xl font-bold text-slate-900">Together</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Issues and pull requests
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">
              Contribution activity
            </p>
            <span className="text-[11px] text-slate-500">Illustrative</span>
          </div>

          <div
            className="grid grid-flow-col grid-rows-7 gap-1"
            style={{ gridAutoColumns: "1fr" }}
            aria-hidden="true"
          >
            {activity.map((c, i) => (
              <span
                key={i}
                className={`ll-cell aspect-square rounded-[3px] ${activityColors[c.level]}`}
                style={{ animationDelay: `${0.9 + c.col * 0.035}s` }}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
            <span>Less</span>
            {activityColors.map((c) => (
              <span key={c} className={`size-2.5 rounded-[3px] ${c}`} />
            ))}
            <span>More</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <span className="flex items-center gap-2">
            <span className="ll-pulse size-2 rounded-full bg-teal-500" />
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
function LightLogin({ onToggleTheme }) {
  const [loading, setLoading] = useState(false);
  const cardGlare = useGlare();

  const handleGithubLogin = () => {
    if (loading) return;
    setLoading(true);
    window.location.href = "/api/auth/github";
  };

  return (
    <main className="min-h-screen bg-[#EEF1F9] text-slate-900">
      <style>{styles}</style>

      <div className="grid min-h-screen md:grid-cols-2">
        {/* -------------------------- branding -------------------------- */}
        <section className="relative flex min-h-[440px] flex-col overflow-hidden bg-gradient-to-br from-[#C7C9F5] via-[#D5D1F3] to-[#BFD9E8] px-6 py-7 sm:px-10 md:min-h-screen md:px-8 lg:px-12 xl:px-16">
          {/* ambient glows */}
          <div className="ll-drift pointer-events-none absolute -left-40 top-20 size-96 rounded-full bg-indigo-400/35 blur-3xl" />
          <div
            className="ll-drift pointer-events-none absolute -right-40 bottom-10 size-96 rounded-full bg-violet-400/35 blur-3xl"
            style={{ animationDelay: "-7s" }}
          />
          <div className="pointer-events-none absolute right-10 top-1/3 size-48 rounded-full bg-teal-300/30 blur-3xl" />

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
              className="ll-grid absolute -inset-x-1/2 bottom-0 h-[200%] origin-bottom"
              style={{
                transform: "rotateX(62deg)",
                backgroundSize: "56px 56px",
                backgroundImage:
                  "linear-gradient(to right, rgba(79,70,229,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(79,70,229,0.2) 1px, transparent 1px)",
              }}
            />
          </div>

          <a
            href="/"
            className="ll-rise relative z-10 flex w-fit items-center gap-3 rounded-lg text-xl font-bold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500"
            style={{ animationDelay: "0.05s" }}
            aria-label="DevCollab home"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-extrabold text-white shadow-lg shadow-indigo-600/25">
              D
            </span>
            DevCollab
          </a>

          <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12 md:py-10">
            <div
              className="ll-rise mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200/80 bg-white/60 px-3 py-2 text-xs font-semibold text-indigo-800 shadow-sm backdrop-blur-sm"
              style={{ animationDelay: "0.15s" }}
            >
              <span className="ll-pulse size-2 rounded-full bg-teal-500" />
              A connected workspace for developers
            </div>

            <h1
              className="ll-rise max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl xl:text-6xl"
              style={{ animationDelay: "0.25s" }}
            >
              Your GitHub workflow.
              <span className="mt-1 block bg-gradient-to-r from-indigo-700 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                One connected workspace.
              </span>
            </h1>

            <p
              className="ll-rise mt-5 max-w-lg text-sm leading-7 text-slate-700 sm:text-base"
              style={{ animationDelay: "0.35s" }}
            >
              Bring repositories, issues, pull requests and developer insights
              together. Make collaboration simpler and understand your team's
              development activity.
            </p>

            <div
              className="ll-rise mt-10 hidden md:block"
              style={{ animationDelay: "0.5s" }}
            >
              <LightDashboardPreview />
            </div>

            <p
              className="ll-rise mt-8 text-xs font-medium text-slate-600"
              style={{ animationDelay: "0.6s" }}
            >
              Built for individual developers, teams and open-source
              contributors.
            </p>
          </div>

          <div className="relative z-10 hidden items-center justify-between border-t border-indigo-200/70 pt-5 text-xs text-slate-600 md:flex">
            <span>© {new Date().getFullYear()} DevCollab</span>
            <span>Made for people who build things.</span>
          </div>
        </section>

        {/* ---------------------------- login --------------------------- */}
        <section className="relative flex min-h-[560px] flex-col overflow-hidden bg-gradient-to-br from-[#F4F5FB] via-[#EDF0F8] to-[#E8ECF7] px-6 py-6 sm:px-10 md:min-h-screen md:px-8 lg:px-12 xl:px-16">
          <div className="pointer-events-none absolute -right-40 top-20 size-96 rounded-full bg-violet-200/30 blur-3xl" />

          <div
            className="ll-rise relative z-10 flex items-center justify-end"
            style={{ animationDelay: "0.1s" }}
          >
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Switch to dark theme"
              className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-slate-300/80 bg-white/70 px-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <MoonIcon />
              <span className="hidden sm:inline">Dark mode</span>
            </button>
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
            <div
              {...cardGlare}
              className="ll-rise group relative overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-6 shadow-2xl shadow-indigo-950/[0.09] backdrop-blur-xl transition-colors duration-300 hover:border-indigo-200 sm:p-9"
              style={{ animationDelay: "0.3s" }}
            >
              <Glare color="rgba(99,102,241,0.1)" />

              <div className="relative">
                <div className="mb-8">
                  <div className="mb-5 grid size-12 place-items-center rounded-xl bg-indigo-100 text-indigo-700 transition duration-300 group-hover:scale-105 group-hover:bg-indigo-200/70">
                    <span className="text-xl font-extrabold">D</span>
                  </div>

                  <p className="mb-3 text-sm font-bold text-indigo-700">
                    Welcome back
                  </p>

                  <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Welcome to DevCollab
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Sign in securely using your GitHub account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGithubLogin}
                  disabled={loading}
                  aria-busy={loading}
                  className="group/btn relative flex min-h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-600/25 transition duration-200 hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-600/35 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 active:translate-y-0 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0"
                >
                  {/* shine sweep */}
                  <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-700 group-hover/btn:left-full group-hover/btn:opacity-100" />
                  <span className="relative flex items-center gap-3">
                    {loading ? <Spinner /> : <GithubIcon />}
                    {loading ? "Redirecting to GitHub" : "Continue with GitHub"}
                  </span>
                </button>

                <div className="my-7 flex items-center gap-4">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-medium text-slate-500">
                    Secure authentication
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4 text-sm leading-6 text-slate-700 transition duration-200 hover:border-indigo-200">
                  <div className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                    <span className="grid size-5 place-items-center rounded-full bg-teal-500/15 text-xs text-teal-600">
                      ✓
                    </span>
                    Your account, your permissions
                  </div>
                  Sign in with GitHub first. Repository access is managed
                  separately through the DevCollab GitHub App.
                </div>

                <p className="mt-7 text-center text-xs leading-6 text-slate-600">
                  By continuing, you agree to our{" "}
                  <a
                    href="/terms"
                    className="font-bold text-indigo-700 underline-offset-4 transition hover:text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="font-bold text-indigo-700 underline-offset-4 transition hover:text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>

            <p
              className="ll-rise mt-6 text-center text-xs font-medium text-slate-600"
              style={{ animationDelay: "0.45s" }}
            >
              No email or password required. Sign in with GitHub.
            </p>
          </div>

          <div className="relative z-10 border-t border-slate-300/70 py-5 text-center text-xs text-slate-500 md:hidden">
            © {new Date().getFullYear()} DevCollab
          </div>
        </section>
      </div>
    </main>
  );
}

export default LightLogin;