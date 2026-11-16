
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ------------------------------------------------------------------ */
/* Animations                                                          */
/* ------------------------------------------------------------------ */
const styles = `
@keyframes dc-cell {
  from { opacity: 0; transform: scale(0.4); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes dc-grid-move {
  from { background-position: 0 0; }
  to { background-position: 0 56px; }
}
@keyframes dc-rise {
  from { opacity: 0; transform: translate3d(0, 22px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
.dc-rise { opacity: 0; animation: dc-rise 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
.dc-grid { animation: dc-grid-move 3s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .dc-rise, .dc-grid { opacity: 1; animation: none; }
}
`;

/* ------------------------------------------------------------------ */
/* 3D tilt card                                                         */
/* ------------------------------------------------------------------ */
function TiltCard({ children, className = "" }) {
    const ref = useRef(null);

    const handleMove = (e) => {
        const el = ref.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateZ(8px)`;
        el.style.setProperty("--mx", `${x * 100}%`);
        el.style.setProperty("--my", `${y * 100}%`);
    };

    const handleLeave = () => {
        if (ref.current) {
            ref.current.style.transform =
                "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)";
        }
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm transition-[transform,border-color] duration-200 ease-out will-change-transform hover:border-indigo-400/50 ${className}`}
            style={{ transformStyle: "preserve-3d" }}
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background:
                        "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(129,140,248,0.22), transparent 60%)",
                }}
            />
            <div className="relative">{children}</div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Pull request helpers                                                 */
/* ------------------------------------------------------------------ */
const statusStyles = {
    OPEN: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    CLOSED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    MERGED: "border-violet-500/30 bg-violet-500/10 text-violet-300",
};

function formatDate(date) {
    if (!date) return "Date unavailable";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function PullRequestStat({ label, value, color, icon }) {
    return (
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-400">{label}</span>
                <span className={`text-lg ${color}`}>{icon}</span>
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Pull request dashboard                                               */
/* ------------------------------------------------------------------ */
function PullRequestOverview({
    pullRequests,
    stats,
    loading,
    error,
    partialErrors,
    hasRepositories,
}) {
    const recentPullRequests = useMemo(
        () =>
            [...pullRequests]
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt || 0) -
                        new Date(a.updatedAt || 0)
                )
                .slice(0, 6),
        [pullRequests]
    );

    return (
        <section className="mt-16">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-indigo-400">
                        GitHub integration
                    </p>
                    <h3 className="mt-1 text-2xl font-bold">
                        Pull Request Overview
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                        Track pull requests across your connected repositories.
                    </p>
                </div>

                <Link
                    to="/pull-requests"
                    className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-300 transition hover:border-indigo-400 hover:bg-indigo-500/20 hover:text-white"
                >
                    View all pull requests →
                </Link>
            </div>

            {loading ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-400/20 border-t-indigo-400" />
                    <p className="mt-4 text-sm text-slate-400">
                        Fetching pull requests from GitHub...
                    </p>
                </div>
            ) : error ? (
                <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6">
                    <p className="font-medium text-rose-300">
                        Unable to load pull requests
                    </p>
                    <p className="mt-2 text-sm text-slate-400">{error}</p>
                </div>
            ) : !hasRepositories ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl text-indigo-300">
                        ↗
                    </div>
                    <h4 className="mt-4 font-semibold">
                        No connected repositories yet
                    </h4>
                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                        Connect a GitHub repository to start tracking its pull
                        requests directly from your dashboard.
                    </p>
                    <Link
                        to="/repositories"
                        className="mt-5 inline-flex rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                    >
                        Connect repository
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <PullRequestStat
                            label="Total PRs"
                            value={stats.total}
                            color="text-indigo-300"
                            icon="↗"
                        />
                        <PullRequestStat
                            label="Open"
                            value={stats.open}
                            color="text-emerald-300"
                            icon="○"
                        />
                        <PullRequestStat
                            label="Merged"
                            value={stats.merged}
                            color="text-violet-300"
                            icon="✓"
                        />
                        <PullRequestStat
                            label="Closed"
                            value={stats.closed}
                            color="text-rose-300"
                            icon="×"
                        />
                    </div>

                    {partialErrors > 0 && (
                        <p className="mt-4 text-xs text-amber-300">
                            Some repositories could not be loaded. The
                            statistics may be incomplete.
                        </p>
                    )}

                    <div className="mt-8">
                        <div className="mb-4 flex items-center justify-between">
                            <h4 className="font-semibold">Recent Pull Requests</h4>
                            <span className="text-xs text-slate-500">
                                Latest 6
                            </span>
                        </div>

                        {recentPullRequests.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
                                <p className="font-medium text-slate-300">
                                    No pull requests found
                                </p>
                                <p className="mt-2 text-sm text-slate-500">
                                    Your connected repositories don't have any
                                    pull requests yet.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                                {recentPullRequests.map((pr, index) => (
                                    <div
                                        key={`${pr.repositoryId}-${pr.number}`}
                                        className={`flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03] ${
                                            index !== recentPullRequests.length - 1
                                                ? "border-b border-white/10"
                                                : ""
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <a
                                                href={pr.htmlUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-slate-100 transition hover:text-indigo-300"
                                            >
                                                {pr.title}
                                            </a>

                                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                                <span>#{pr.number}</span>
                                                <span>{pr.repositoryName}</span>
                                                <span>by {pr.author || "Unknown"}</span>
                                                <span>
                                                    Updated {formatDate(pr.updatedAt)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            {pr.isDraft && (
                                                <span className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                                                    Draft
                                                </span>
                                            )}
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                                    statusStyles[pr.state] ||
                                                    "border-slate-600 bg-slate-800 text-slate-300"
                                                }`}
                                            >
                                                {pr.state}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* Quick-start cards                                                    */
/* ------------------------------------------------------------------ */
const iconProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

const cards = [
    {
        title: "Start a project",
        text: "Set up a shared space for your repo, tasks and discussions.",
        icon: (
            <svg {...iconProps}>
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M12 11v4M10 13h4" />
            </svg>
        ),
    },
    {
        title: "Invite teammates",
        text: "Bring collaborators in and decide who can see what.",
        icon: (
            <svg {...iconProps}>
                <circle cx="9" cy="8" r="3.5" />
                <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
                <path d="M19 8v6M16 11h6" />
            </svg>
        ),
    },
    {
        title: "Connect GitHub",
        text: "Link your repositories so pull requests show up here.",
        icon: (
            <svg {...iconProps}>
                <circle cx="6" cy="6" r="2.5" />
                <circle cx="6" cy="18" r="2.5" />
                <circle cx="18" cy="9" r="2.5" />
                <path d="M6 8.5v7M18 11.5c0 3-4 3-10.5 5.2" />
            </svg>
        ),
    },
];

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */
function Dashboard() {
    const { user } = useAuth();
    const name = user?.displayName || "Developer";
    const initial = name.trim().charAt(0).toUpperCase();

    const [pullRequests, setPullRequests] = useState([]);
    const [loadingPullRequests, setLoadingPullRequests] = useState(true);
    const [pullRequestError, setPullRequestError] = useState("");
    const [partialErrors, setPartialErrors] = useState(0);
    const [hasRepositories, setHasRepositories] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadDashboardPullRequests = async () => {
            setLoadingPullRequests(true);
            setPullRequestError("");

            try {
                // Retrieve the user's personal workspace.
                const workspaceResponse = await fetch(
                    "/api/github/workspace/personal",
                    { credentials: "include" }
                );

                const workspaceData = await workspaceResponse.json();

                if (!workspaceResponse.ok || !workspaceData.success) {
                    throw new Error(
                        workspaceData.message || "Unable to load your workspace."
                    );
                }

                const workspaceId = workspaceData.workspace.id;

                // Retrieve repositories connected to the personal workspace.
                const repositoriesResponse = await fetch(
                    `/api/github/workspaces/${workspaceId}/repositories`,
                    { credentials: "include" }
                );

                const repositoriesData = await repositoriesResponse.json();

                if (!repositoriesResponse.ok || !repositoriesData.success) {
                    throw new Error(
                        repositoriesData.message ||
                            "Unable to load connected repositories."
                    );
                }

                const repositories = repositoriesData.repositories || [];

                if (cancelled) return;

                setHasRepositories(repositories.length > 0);

                if (repositories.length === 0) {
                    setPullRequests([]);
                    setPartialErrors(0);
                    return;
                }

                // Fetch pull requests from all connected repositories.
                const results = await Promise.allSettled(
                    repositories.map(async (repository) => {
                        const response = await fetch(
                            `/api/github/repositories/${repository.id}/pull-requests`,
                            { credentials: "include" }
                        );

                        const data = await response.json();

                        if (!response.ok || !data.success) {
                            throw new Error(
                                data.message ||
                                    `Unable to load PRs for ${repository.fullName}.`
                            );
                        }

                        return (data.pullRequests || []).map((pr) => ({
                            ...pr,
                            repositoryId: repository.id,
                            repositoryName: repository.fullName,
                        }));
                    })
                );

                if (cancelled) return;

                const successfulResults = results
                    .filter((result) => result.status === "fulfilled")
                    .flatMap((result) => result.value);

                const failedResults = results.filter(
                    (result) => result.status === "rejected"
                ).length;

                setPullRequests(successfulResults);
                setPartialErrors(failedResults);
            } catch (error) {
                if (!cancelled) {
                    setPullRequestError(
                        error.message || "Something went wrong while loading pull requests."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingPullRequests(false);
                }
            }
        };

        loadDashboardPullRequests();

        return () => {
            cancelled = true;
        };
    }, []);

    const stats = useMemo(() => {
        return pullRequests.reduce(
            (result, pr) => {
                result.total += 1;

                if (pr.state === "OPEN") result.open += 1;
                if (pr.state === "MERGED") result.merged += 1;
                if (pr.state === "CLOSED") result.closed += 1;

                return result;
            },
            { total: 0, open: 0, merged: 0, closed: 0 }
        );
    }, [pullRequests]);

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-10">
            <style>{styles}</style>

            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />

                {/* Perspective grid floor */}
                <div
                    className="absolute inset-x-0 bottom-0 h-[55%]"
                    style={{
                        perspective: "500px",
                        maskImage:
                            "linear-gradient(to top, black 15%, transparent 95%)",
                        WebkitMaskImage:
                            "linear-gradient(to top, black 15%, transparent 95%)",
                    }}
                >
                    <div
                        className="dc-grid absolute -inset-x-1/2 bottom-0 h-[200%] origin-bottom"
                        style={{
                            transform: "rotateX(62deg)",
                            backgroundSize: "56px 56px",
                            backgroundImage:
                                "linear-gradient(to right, rgba(129,140,248,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(129,140,248,0.22) 1px, transparent 1px)",
                        }}
                    />
                </div>
            </div>

            <div className="relative mx-auto max-w-6xl">
                {/* Header */}
                <header
                    className="dc-rise flex flex-wrap items-center justify-between gap-4"
                    style={{ animationDelay: "0.05s" }}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-mono text-sm font-bold shadow-lg shadow-indigo-500/30">
                            DC
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-tight tracking-tight">
                                DevCollab
                            </h1>
                            <p className="text-xs text-slate-400">
                                Developer Collaboration Platform
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            to="/issues"
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white"
                        >
                            Issues
                        </Link>

                        <Link
                            to="/pull-requests"
                            className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200 transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white"
                        >
                            Pull Requests
                        </Link>

                        <Link
                            to="/repositories"
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white"
                        >
                            Repositories
                        </Link>

                        <Link
                            to="/saved-issues"
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white"
                        >
                            Saved Issues
                        </Link>

                        <Link
                            to="/settings"
                            className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-400 hover:text-white"
                        >
                            Account Settings
                        </Link>

                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/20 text-sm font-semibold text-indigo-100"
                            title={name}
                        >
                            {initial}
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="mt-14 grid items-center gap-10 lg:mt-20 lg:grid-cols-2">
                    <div>
                        <p
                            className="dc-rise text-sm font-medium text-indigo-400"
                            style={{ animationDelay: "0.15s" }}
                        >
                            Your workspace
                        </p>

                        <h2
                            className="dc-rise mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
                            style={{ animationDelay: "0.25s" }}
                        >
                            Welcome back,{" "}
                            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-indigo-400 bg-clip-text text-transparent">
                                {name}
                            </span>
                            .
                        </h2>

                        <p
                            className="dc-rise mt-5 max-w-md text-base leading-relaxed text-slate-400"
                            style={{ animationDelay: "0.35s" }}
                        >
                            Your workspace at a glance. Track your repositories,
                            issues, and pull requests in one place.
                        </p>

                        <div
                            className="dc-rise mt-8 flex flex-wrap gap-3"
                            style={{ animationDelay: "0.45s" }}
                        >
                            <Link
                                to="/repositories"
                                className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400"
                            >
                                Explore repositories
                            </Link>
                            <Link
                                to="/settings"
                                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/60"
                            >
                                Edit your profile
                            </Link>
                        </div>
                    </div>

                    <div
                        className="dc-rise mx-auto w-full max-w-[440px] rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur"
                        style={{ animationDelay: "0.35s" }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900">
                                <svg
                                    viewBox="0 0 16 16"
                                    fill="currentColor"
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                >
                                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold">
                                    GitHub connected
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Live repository data
                                </p>
                            </div>
                            <span className="ml-auto h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/40" />
                        </div>

                        <p className="mt-6 text-sm leading-relaxed text-slate-400">
                            Your connected repositories are synced with GitHub.
                            Pull request activity and statistics are available
                            below.
                        </p>

                        <Link
                            to="/repositories"
                            className="mt-6 inline-flex items-center gap-2 border-t border-white/10 pt-5 text-sm font-semibold text-indigo-300 transition hover:text-white"
                        >
                            Manage connected repositories →
                        </Link>
                    </div>
                </section>

                {/* Pull request overview */}
                <PullRequestOverview
                    pullRequests={pullRequests}
                    stats={stats}
                    loading={loadingPullRequests}
                    error={pullRequestError}
                    partialErrors={partialErrors}
                    hasRepositories={hasRepositories}
                />

                {/* Quick start */}
                <section className="mt-16 pb-10 lg:mt-20">
                    <h3
                        className="dc-rise text-lg font-semibold"
                        style={{ animationDelay: "0.6s" }}
                    >
                        Get set up
                    </h3>

                    <div
                        className="dc-rise mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                        style={{ animationDelay: "0.7s" }}
                    >
                        {cards.map((card) => (
                            <TiltCard key={card.title}>
                                <div className="flex items-start justify-between">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 transition duration-300 group-hover:scale-110 group-hover:bg-indigo-500/25">
                                        {card.icon}
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2.5 py-0.5 text-xs text-slate-400">
                                        Coming soon
                                    </span>
                                </div>
                                <h4 className="mt-5 text-base font-semibold">
                                    {card.title}
                                </h4>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                                    {card.text}
                                </p>
                            </TiltCard>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Dashboard;
