
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
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="size-5"
            aria-hidden="true"
        >
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

function LightDashboardPreview() {
    const activity = [
        1, 2, 0, 3, 1, 4, 2, 0, 3, 4, 1, 2, 3, 0, 4, 2, 1, 3,
        4, 2, 0, 1, 3, 4, 2, 1, 0, 3, 2, 4, 1, 3, 2, 4, 1,
    ];

    const activityColors = [
        "bg-slate-200",
        "bg-indigo-200",
        "bg-indigo-300",
        "bg-violet-400",
        "bg-teal-500",
    ];

    return (
        <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-indigo-100/80 bg-white/90 p-4 shadow-2xl shadow-indigo-900/[0.09] backdrop-blur-sm sm:p-6">
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
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        Workspace preview
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                        Your overview
                    </h2>
                </div>

                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-700">
                    DEMO
                </span>
            </div>

            <p className="mb-5 text-xs leading-5 text-slate-500">
                An illustration of the insights and collaboration tools DevCollab is
                designed to bring together.
            </p>

            <div className="mb-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50 to-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                        <span className="size-2 rounded-full bg-indigo-500" />
                        Repositories
                    </div>
                    <p className="text-xl font-bold text-slate-900">Explore</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                        Connected projects
                    </p>
                </div>

                <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                        <span className="size-2 rounded-full bg-teal-500" />
                        Collaboration
                    </div>
                    <p className="text-xl font-bold text-slate-900">Together</p>
                    <p className="mt-1 text-[10px] text-slate-500">
                        Issues and pull requests
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">
                        Contribution activity
                    </p>
                    <span className="text-[10px] text-slate-500">Illustrative</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {activity.map((level, index) => (
                        <span
                            key={index}
                            className={`aspect-square rounded-[3px] ${activityColors[level]}`}
                        />
                    ))}
                </div>

                <div className="mt-3 flex justify-between text-[10px] text-slate-500">
                    <span>Less</span>
                    <span>More</span>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600">
                <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-teal-500" />
                    GitHub-powered workspace
                </span>
                <span>Connect to get started</span>
            </div>
        </div>
    );
}

function LightLogin({ onToggleTheme }) {
    const handleGithubLogin = () => {
        window.location.href = "/api/auth/github";
    };

    return (
        <main className="min-h-screen bg-[#EEF1F9] text-slate-900">
            <div className="grid min-h-screen md:grid-cols-2">
                {/* Branding section */}
                <section className="relative flex min-h-[440px] flex-col overflow-hidden bg-gradient-to-br from-[#C7C9F5] via-[#D5D1F3] to-[#BFD9E8] px-6 py-7 sm:px-10 md:min-h-screen md:px-8 lg:px-12 xl:px-16">
                    <div className="pointer-events-none absolute -left-40 top-20 size-96 rounded-full bg-indigo-400/35 blur-3xl" />

                    <div className="pointer-events-none absolute -right-40 bottom-10 size-96 rounded-full bg-violet-400/35 blur-3xl" />

                    <div className="pointer-events-none absolute right-10 top-1/3 size-48 rounded-full bg-teal-300/30 blur-3xl" />
                    <a
                        href="/"
                        className="relative z-10 flex w-fit items-center gap-3 rounded-lg text-xl font-bold tracking-tight text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500"
                        aria-label="DevCollab home"
                    >
                        <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-extrabold text-white shadow-lg shadow-indigo-600/25">
                            D
                        </span>
                        DevCollab
                    </a>

                    <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12 md:py-10">
                        <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200/80 bg-white/60 px-3 py-2 text-xs font-semibold text-indigo-800 shadow-sm backdrop-blur-sm">
                            <span className="size-2 rounded-full bg-teal-500" />
                            A connected workspace for developers
                        </div>

                        <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-5xl xl:text-6xl">
                            Your GitHub workflow.
                            <span className="mt-1 block text-indigo-700">
                                One connected workspace.
                            </span>
                        </h1>

                        <p className="mt-5 max-w-lg text-sm leading-7 text-slate-700 sm:text-base">
                            Bring repositories, issues, pull requests and developer insights
                            together. Make collaboration simpler and understand your team's
                            development activity.
                        </p>

                        <div className="mt-10 hidden md:block">
                            <LightDashboardPreview />
                        </div>

                        <p className="mt-8 text-xs font-medium text-slate-600">
                            Built for individual developers, teams and open-source
                            contributors.
                        </p>
                    </div>

                    <div className="relative z-10 hidden items-center justify-between border-t border-indigo-200/70 pt-5 text-xs text-slate-600 md:flex">
                        <span>© {new Date().getFullYear()} DevCollab</span>
                        <span>Made for people who build things.</span>
                    </div>
                </section>

                {/* Login section */}
                <section className="relative flex min-h-[560px] flex-col overflow-hidden bg-gradient-to-br from-[#F4F5FB] via-[#EDF0F8] to-[#E8ECF7] px-6 py-6 sm:px-10 md:min-h-screen md:px-8 lg:px-12 xl:px-16">
                    <div className="pointer-events-none absolute -right-40 top-20 size-96 rounded-full bg-violet-200/30 blur-3xl" />

                    <div className="relative z-10 flex items-center justify-end">
                        <button
                            type="button"
                            onClick={onToggleTheme}
                            aria-label="Switch to dark theme"
                            className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-slate-300/80 bg-white/70 px-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-indigo-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            <MoonIcon />
                            <span className="hidden sm:inline">Dark mode</span>
                        </button>
                    </div>

                    <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
                        <div className="rounded-2xl border border-white/80 bg-white/85 p-6 shadow-2xl shadow-indigo-950/[0.09] backdrop-blur-xl sm:p-9">
                            <div className="mb-8">
                                <div className="mb-5 grid size-12 place-items-center rounded-xl bg-indigo-100 text-indigo-700">
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
                                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-700 hover:to-violet-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 active:scale-[0.99]"
                            >
                                <GithubIcon />
                                Continue with GitHub
                            </button>

                            <div className="my-7 flex items-center gap-4">
                                <span className="h-px flex-1 bg-slate-200" />
                                <span className="text-xs font-medium text-slate-500">
                                    Secure authentication
                                </span>
                                <span className="h-px flex-1 bg-slate-200" />
                            </div>

                            <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4 text-sm leading-6 text-slate-700">
                                <div className="mb-2 flex items-center gap-2 font-bold text-slate-900">
                                    <span className="text-teal-600">✓</span>
                                    Your account, your permissions
                                </div>

                                Sign in with GitHub first. Repository access is managed
                                separately through the DevCollab GitHub App.
                            </div>

                            <p className="mt-7 text-center text-xs leading-6 text-slate-600">
                                By continuing, you agree to our{" "}
                                <a
                                    href="/terms"
                                    className="font-bold text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                >
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a
                                    href="/privacy"
                                    className="font-bold text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                                >
                                    Privacy Policy
                                </a>
                                .
                            </p>
                        </div>

                        <p className="mt-6 text-center text-xs font-medium text-slate-600">
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
