
import React from "react";

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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardPreview() {
  const activity = [
    1, 2, 0, 3, 1, 4, 2, 0, 3, 4, 1, 2, 3, 0, 4, 2, 1, 3,
    4, 2, 0, 1, 3, 4, 2, 1, 0, 3, 2, 4, 1, 3, 2, 4, 1,
  ];

  const activityColors = [
    "bg-white/10",
    "bg-indigo-400/40",
    "bg-indigo-400/60",
    "bg-violet-400/70",
    "bg-teal-400",
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900/80 p-4 text-slate-100 shadow-2xl shadow-black/20 sm:p-6">
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
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-500">
            Workspace preview
          </p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">
            Your overview
          </h2>
        </div>

        <span className="rounded-full bg-indigo-500/10 px-3 py-1.5 text-[10px] font-semibold text-indigo-400">
          DEMO
        </span>
      </div>

      <p className="mb-5 text-xs leading-5 opacity-60">
        An illustration of the insights and collaboration tools DevCollab is
        designed to bring together.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs opacity-60">
            <span className="size-2 rounded-full bg-indigo-500" />
            Repositories
          </div>
          <p className="text-xl font-bold">Explore</p>
          <p className="mt-1 text-[10px] opacity-50">
            Connected projects
          </p>
        </div>

        <div className="rounded-xl border border-white/10 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs opacity-60">
            <span className="size-2 rounded-full bg-teal-500" />
            Collaboration
          </div>
          <p className="text-xl font-bold">Together</p>
          <p className="mt-1 text-[10px] opacity-50">
            Issues and pull requests
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-3 sm:p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold">Contribution activity</p>
          <span className="text-[10px] opacity-50">Illustrative</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {activity.map((level, index) => (
            <span
              key={index}
              className={`aspect-square rounded-[3px] ${activityColors[level]}`}
            />
          ))}
        </div>

        <div className="mt-3 flex justify-between text-[10px] opacity-50">
          <span>Less</span>
          <span>More</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] opacity-60">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-teal-500" />
          GitHub-powered workspace
        </span>
        <span>Connect to get started</span>
      </div>
    </div>
  );
}

function DarkLogin({ onToggleTheme }) {
  const handleGithubLogin = () => {
    window.location.href = "/api/auth/github";
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="grid min-h-screen md:grid-cols-2">
        <section className="relative flex min-h-[440px] flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 px-6 py-7 text-white sm:px-10 md:min-h-screen md:px-8 lg:px-12 xl:px-16">
          <div className="pointer-events-none absolute -right-32 top-20 size-96 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-teal-400/15 blur-3xl" />

          <a
            href="/"
            className="relative z-10 flex w-fit items-center gap-3 rounded-lg text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500"
            aria-label="DevCollab home"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-white text-lg font-extrabold text-indigo-700 shadow-lg">
              D
            </span>
            DevCollab
          </a>

          <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12 md:py-10">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-indigo-50">
              <span className="size-2 rounded-full bg-teal-300" />
              A connected workspace for developers
            </div>

            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-5xl xl:text-6xl">
              Your GitHub workflow.
              <span className="mt-1 block text-teal-200">
                One connected workspace.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-indigo-100 sm:text-base">
              Bring repositories, issues, pull requests and developer insights
              together. Make collaboration simpler and understand your team's
              development activity.
            </p>

            <div className="mt-10 hidden md:block">
              <DashboardPreview />
            </div>

            <p className="mt-8 text-xs text-indigo-100/70">
              Built for individual developers, teams and open-source
              contributors.
            </p>
          </div>

          <div className="relative z-10 hidden items-center justify-between border-t border-white/15 pt-5 text-xs text-indigo-100/70 md:flex">
            <span>© {new Date().getFullYear()} DevCollab</span>
            <span>Made for people who build things.</span>
          </div>
        </section>

        <section className="flex min-h-[560px] flex-col px-6 py-6 sm:px-10 md:min-h-screen md:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Switch to light theme"
              className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <SunIcon />
              <span className="hidden sm:inline">Light mode</span>
            </button>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm shadow-black/20 sm:p-9">
              <div className="mb-8">
                <p className="mb-3 text-sm font-semibold text-indigo-500">
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
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 active:scale-[0.99]"
              >
                <GithubIcon />
                Continue with GitHub
              </button>

              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-slate-700" />
                <span className="text-xs text-slate-400">
                  Secure authentication
                </span>
                <span className="h-px flex-1 bg-slate-700" />
              </div>

              <div className="rounded-xl bg-slate-800/70 p-4 text-sm leading-6 text-slate-300">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  <span className="text-teal-500">✓</span>
                  Your account, your permissions
                </div>

                Sign in with GitHub first. Repository access is managed
                separately through the DevCollab GitHub App.
              </div>

              <p className="mt-7 text-center text-xs leading-6 text-slate-400">
                By continuing, you agree to our{" "}
                <a
                  href="/terms"
                  className="font-semibold text-indigo-400 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="font-semibold text-indigo-400 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
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
