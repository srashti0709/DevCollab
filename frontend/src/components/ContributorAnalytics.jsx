
import { useEffect, useMemo, useState } from "react";

const API = "/api/github/repositories";

const tabs = [
    { id: "overview", label: "Overview" },
    { id: "contributors", label: "Contributors" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "compare", label: "Compare" },
    { id: "timeline", label: "Timeline" },
];

function ContributorAnalytics({ repositoryId }) {
    const [activeTab, setActiveTab] = useState("overview");

    const [contributors, setContributors] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [activity, setActivity] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedContributor, setSelectedContributor] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [selectedUsernames, setSelectedUsernames] = useState([]);
    const [comparison, setComparison] = useState(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [comparisonError, setComparisonError] = useState("");

    const [timeline, setTimeline] = useState([]);
    const [timelinePage, setTimelinePage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [timelineError, setTimelineError] = useState("");

    const baseUrl = `${API}/${repositoryId}`;

    const request = async (url) => {
        const response = await fetch(url, {
            credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Something went wrong.");
        }

        return data;
    };

    useEffect(() => {
        let cancelled = false;

        const loadAnalytics = async () => {
            setLoading(true);
            setError("");

            try {
                const results = await Promise.allSettled([
                    request(`${baseUrl}/contributors`),
                    request(`${baseUrl}/contribution-statistics`),
                    request(`${baseUrl}/contributor-leaderboard`),
                    request(`${baseUrl}/activity-graph`),
                ]);

                if (cancelled) return;

                const failures = [];

                if (results[0].status === "fulfilled") {
                    setContributors(results[0].value.contributors || []);
                } else {
                    failures.push("contributors");
                }

                if (results[1].status === "fulfilled") {
                    setStatistics(results[1].value.statistics || null);
                } else {
                    failures.push("statistics");
                }

                if (results[2].status === "fulfilled") {
                    setLeaderboard(results[2].value.leaderboard || []);
                } else {
                    failures.push("leaderboard");
                }

                if (results[3].status === "fulfilled") {
                    setActivity(results[3].value.activity || null);
                } else {
                    failures.push("activity graph");
                }

                if (failures.length > 0) {
                    setError(
                        `Some analytics could not be loaded: ${failures.join(", ")}.`
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "Unable to load analytics.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadAnalytics();

        return () => {
            cancelled = true;
        };
    }, [repositoryId]);

    const openContributorProfile = async (username) => {
        if (!username || username === "Anonymous") return;

        setProfileLoading(true);
        setSelectedContributor(null);

        try {
            const data = await request(
                `${baseUrl}/contributors/${encodeURIComponent(username)}/profile`
            );

            setSelectedContributor(data.profile);
        } catch (err) {
            setError(err.message || "Unable to load contributor profile.");
        } finally {
            setProfileLoading(false);
        }
    };

    const toggleContributor = (username) => {
        setComparison(null);
        setComparisonError("");

        setSelectedUsernames((current) => {
            if (current.includes(username)) {
                return current.filter((item) => item !== username);
            }

            if (current.length >= 4) {
                return current;
            }

            return [...current, username];
        });
    };

    const compareSelectedContributors = async () => {
        if (selectedUsernames.length < 2) return;

        setComparisonLoading(true);
        setComparisonError("");
        setComparison(null);

        try {
            const usernames = selectedUsernames
                .map(encodeURIComponent)
                .join(",");

            const data = await request(
                `${baseUrl}/compare-contributors?usernames=${usernames}`
            );

            setComparison(data.comparison);
        } catch (err) {
            setComparisonError(
                err.message || "Unable to compare contributors."
            );
        } finally {
            setComparisonLoading(false);
        }
    };

    const loadTimeline = async (page, append = false) => {
        setTimelineLoading(true);
        setTimelineError("");

        try {
            const data = await request(
                `${baseUrl}/contribution-timeline?page=${page}&perPage=10`
            );

            setTimeline((current) =>
                append ? [...current, ...data.timeline] : data.timeline
            );

            setTimelinePage(page);
            setHasNextPage(data.pagination.hasNextPage);
        } catch (err) {
            setTimelineError(
                err.message || "Unable to load contribution timeline."
            );
        } finally {
            setTimelineLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "timeline" && timeline.length === 0) {
            loadTimeline(1);
        }
    }, [activeTab, repositoryId]);

    const chartPoints = useMemo(() => {
        const weeks = activity?.weeklyActivity || [];

        if (weeks.length === 0) return [];

        const max = Math.max(
            ...weeks.map((week) => week.totalCommits),
            1
        );

        return weeks.map((week, index) => ({
            x: (index / Math.max(weeks.length - 1, 1)) * 760,
            y: 170 - (week.totalCommits / max) * 145,
            ...week,
        }));
    }, [activity]);

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatNumber = (value) =>
        Number(value || 0).toLocaleString("en-IN");

    const cardClass =
        "rounded-2xl border border-white/10 bg-slate-900/70 p-5";

    const mutedText = "text-sm text-slate-400";

    if (loading) {
        return (
            <section className="mt-12 rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                <p className="mt-4 text-sm text-slate-400">
                    Loading contributor analytics...
                </p>
            </section>
        );
    }

    return (
        <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                        Repository Insights
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                        Contributor Analytics
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Explore contributors, activity and repository contributions.
                    </p>
                </div>

                <span className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300">
                    Live GitHub Data
                </span>
            </div>

            {error && (
                <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
                    {error}
                </div>
            )}

            <div className="mt-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                            activeTab === tab.id
                                ? "bg-indigo-600 text-white"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === "overview" && (
                <div className="mt-6 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                            {
                                label: "Contributors",
                                value: statistics?.totalContributors ?? contributors.length,
                                icon: "👥",
                            },
                            {
                                label: "Total Contributions",
                                value: statistics?.totalCommits ?? 0,
                                icon: "⌘",
                            },
                            {
                                label: "Average Contributions",
                                value: statistics?.averageCommitsPerContributor ?? 0,
                                icon: "📊",
                            },
                            {
                                label: "Weekly Activity",
                                value: activity?.averageWeeklyCommits ?? 0,
                                icon: "📈",
                            },
                        ].map((item) => (
                            <div key={item.label} className={cardClass}>
                                <div className="flex items-center justify-between">
                                    <p className={mutedText}>{item.label}</p>
                                    <span className="text-xl">{item.icon}</span>
                                </div>
                                <p className="mt-4 text-3xl font-bold text-white">
                                    {formatNumber(item.value)}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className={cardClass}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="font-semibold text-white">
                                    Repository Activity
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                    Weekly commits over the last 52 weeks
                                </p>
                            </div>
                            <span className="rounded-lg bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
                                {formatNumber(activity?.totalCommits)} commits
                            </span>
                        </div>

                        {chartPoints.length > 0 ? (
                            <div className="mt-6 overflow-hidden">
                                <svg
                                    viewBox="0 0 800 210"
                                    className="h-auto w-full"
                                    role="img"
                                    aria-label="Weekly repository commit activity graph"
                                >
                                    {[25, 70, 115, 160].map((y) => (
                                        <line
                                            key={y}
                                            x1="20"
                                            y1={y}
                                            x2="780"
                                            y2={y}
                                            stroke="rgb(71 85 105 / 0.35)"
                                            strokeDasharray="5 6"
                                        />
                                    ))}

                                    <polygon
                                        points={`20,190 ${chartPoints
                                            .map((point) => `${point.x + 20},${point.y}`)
                                            .join(" ")} 780,190`}
                                        fill="rgb(99 102 241 / 0.13)"
                                    />

                                    <polyline
                                        points={chartPoints
                                            .map((point) => `${point.x + 20},${point.y}`)
                                            .join(" ")}
                                        fill="none"
                                        stroke="#818cf8"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {chartPoints.map((point, index) => (
                                        <circle
                                            key={index}
                                            cx={point.x + 20}
                                            cy={point.y}
                                            r="2.5"
                                            fill="#a5b4fc"
                                        >
                                            <title>
                                                {formatDate(point.weekStarting)}: {point.totalCommits} commits
                                            </title>
                                        </circle>
                                    ))}
                                </svg>

                                <div className="mt-2 flex justify-between text-xs text-slate-500">
                                    <span>52 weeks ago</span>
                                    <span>Recent</span>
                                </div>
                            </div>
                        ) : (
                            <p className="py-12 text-center text-sm text-slate-500">
                                No activity graph data available.
                            </p>
                        )}
                    </div>

                    <div className={cardClass}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-white">
                                    Top Contributors
                                </h3>
                                <p className="mt-1 text-xs text-slate-400">
                                    Highest contribution counts
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveTab("leaderboard")}
                                className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                            >
                                View leaderboard →
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            {leaderboard.slice(0, 5).map((person) => (
                                <div
                                    key={person.githubUserId || person.username}
                                    className="flex items-center gap-3"
                                >
                                    <span className="w-7 text-sm text-slate-500">
                                        #{person.rank}
                                    </span>
                                    {person.avatarUrl ? (
                                        <img
                                            src={person.avatarUrl}
                                            alt=""
                                            className="h-9 w-9 rounded-full"
                                        />
                                    ) : (
                                        <div className="h-9 w-9 rounded-full bg-slate-700" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-white">
                                            {person.username}
                                        </p>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                            <div
                                                className="h-full rounded-full bg-indigo-500"
                                                style={{
                                                    width: `${person.percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-indigo-300">
                                        {formatNumber(person.contributions)}
                                    </span>
                                </div>
                            ))}

                            {leaderboard.length === 0 && (
                                <p className="py-6 text-center text-sm text-slate-500">
                                    No contributors found.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* CONTRIBUTORS */}
            {activeTab === "contributors" && (
                <div className="mt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-white">
                                Repository Contributors
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                                {contributors.length} contributors found
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {contributors.map((person) => (
                            <div
                                key={person.githubUserId || person.username}
                                className={`${cardClass} transition hover:border-indigo-400/40`}
                            >
                                <div className="flex items-center gap-3">
                                    {person.avatarUrl ? (
                                        <img
                                            src={person.avatarUrl}
                                            alt=""
                                            className="h-12 w-12 rounded-full border border-white/10"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-slate-800" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-white">
                                            {person.username}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {person.type}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Contributions
                                        </p>
                                        <p className="mt-1 text-xl font-bold text-indigo-300">
                                            {formatNumber(person.contributions)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            openContributorProfile(person.username)
                                        }
                                        className="rounded-lg border border-indigo-400/20 px-3 py-2 text-xs text-indigo-300 transition hover:bg-indigo-500/10"
                                    >
                                        View Profile →
                                    </button>
                                </div>
                            </div>
                        ))}

                        {contributors.length === 0 && (
                            <p className="text-sm text-slate-500">
                                No contributors found for this repository.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* LEADERBOARD */}
            {activeTab === "leaderboard" && (
                <div className={`${cardClass} mt-6`}>
                    <h3 className="font-semibold text-white">
                        Contributor Leaderboard
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                        Contributors ranked by their contribution counts
                    </p>

                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-xs text-slate-500">
                                    <th className="py-3">Rank</th>
                                    <th className="py-3">Contributor</th>
                                    <th className="py-3">Contributions</th>
                                    <th className="py-3">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaderboard.map((person) => (
                                    <tr
                                        key={person.githubUserId || person.username}
                                        className="border-b border-white/5"
                                    >
                                        <td className="py-4 font-semibold text-indigo-300">
                                            #{person.rank}
                                        </td>
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                {person.avatarUrl && (
                                                    <img
                                                        src={person.avatarUrl}
                                                        alt=""
                                                        className="h-8 w-8 rounded-full"
                                                    />
                                                )}
                                                <span className="font-medium text-white">
                                                    {person.username}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-slate-300">
                                            {formatNumber(person.contributions)}
                                        </td>
                                        <td className="py-4 text-slate-300">
                                            {person.percentage}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {leaderboard.length === 0 && (
                            <p className="py-8 text-center text-sm text-slate-500">
                                No leaderboard data available.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* COMPARISON */}
            {activeTab === "compare" && (
                <div className="mt-6 space-y-5">
                    <div className={cardClass}>
                        <h3 className="font-semibold text-white">
                            Compare Contributors
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Select 2–4 contributors to compare their repository contributions.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {contributors
                                .filter((person) => person.githubUserId && person.username !== "Anonymous")
                                .map((person) => {
                                    const selected = selectedUsernames.includes(
                                        person.username
                                    );

                                    return (
                                        <button
                                            key={person.githubUserId}
                                            onClick={() =>
                                                toggleContributor(person.username)
                                            }
                                            className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                                                selected
                                                    ? "border-indigo-400 bg-indigo-500/10"
                                                    : "border-white/10 bg-slate-950/40 hover:border-white/20"
                                            }`}
                                        >
                                            {person.avatarUrl && (
                                                <img
                                                    src={person.avatarUrl}
                                                    alt=""
                                                    className="h-10 w-10 rounded-full"
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-white">
                                                    {person.username}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {person.contributions} contributions
                                                </p>
                                            </div>
                                            <span className="text-indigo-300">
                                                {selected ? "✓" : "+"}
                                            </span>
                                        </button>
                                    );
                                })}
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-xs text-slate-400">
                                {selectedUsernames.length} of 4 selected
                            </p>
                            <button
                                onClick={compareSelectedContributors}
                                disabled={
                                    selectedUsernames.length < 2 ||
                                    comparisonLoading
                                }
                                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {comparisonLoading
                                    ? "Comparing..."
                                    : "Compare Selected"}
                            </button>
                        </div>

                        {contributors.filter(
                            (person) =>
                                person.githubUserId &&
                                person.username !== "Anonymous"
                        ).length < 2 && (
                            <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                                This repository currently has fewer than two identifiable contributors. Comparison will be available when more contributors are present.
                            </p>
                        )}

                        {comparisonError && (
                            <p className="mt-4 text-sm text-red-400">
                                {comparisonError}
                            </p>
                        )}
                    </div>

                    {comparison && (
                        <div className={cardClass}>
                            <h3 className="font-semibold text-white">
                                Comparison Results
                            </h3>

                            <p className="mt-2 text-sm text-slate-400">
                                Contribution difference:{" "}
                                <span className="font-semibold text-indigo-300">
                                    {comparison.contributionDifference}
                                </span>
                            </p>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                {comparison.contributors.map((person) => (
                                    <div
                                        key={person.githubUserId}
                                        className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                                    >
                                        <p className="font-semibold text-white">
                                            {person.username}
                                        </p>
                                        <p className="mt-3 text-2xl font-bold text-indigo-300">
                                            {person.contributions}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Contributions
                                        </p>
                                        <div className="mt-3 flex justify-between text-xs text-slate-400">
                                            <span>Repository share</span>
                                            <span>{person.contributionPercentage}%</span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Overall rank: #{person.rank ?? "N/A"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CONTRIBUTION TIMELINE */}
            {activeTab === "timeline" && (
                <div className="mt-6">
                    <div className={cardClass}>
                        <h3 className="font-semibold text-white">
                            Contribution Timeline
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                            Recent commits from your GitHub repository
                        </p>

                        {timelineError && (
                            <p className="mt-4 text-sm text-red-400">
                                {timelineError}
                            </p>
                        )}

                        <div className="mt-6 space-y-0">
                            {timeline.map((commit, index) => (
                                <div
                                    key={commit.sha}
                                    className="relative flex gap-4 pb-7"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                                            <span className="text-sm">⌘</span>
                                        </div>
                                        {index !== timeline.length - 1 && (
                                            <div className="mt-2 w-px flex-1 bg-slate-700" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                        <p className="break-words text-sm font-medium leading-relaxed text-white">
                                            {commit.message?.split("\n")[0] || "Commit message unavailable"}
                                        </p>

                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            {commit.author.avatarUrl && (
                                                <img
                                                    src={commit.author.avatarUrl}
                                                    alt=""
                                                    className="h-6 w-6 rounded-full"
                                                />
                                            )}
                                            <span className="text-xs text-slate-400">
                                                {commit.author.username ||
                                                    commit.author.name}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {formatDate(commit.date)}
                                            </span>
                                        </div>

                                        <a
                                            href={commit.commitUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 inline-block text-xs font-medium text-indigo-300 hover:text-indigo-200"
                                        >
                                            View commit →
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {timelineLoading && (
                            <p className="py-5 text-center text-sm text-slate-400">
                                Loading commits...
                            </p>
                        )}

                        {!timelineLoading && timeline.length === 0 && (
                            <p className="py-8 text-center text-sm text-slate-500">
                                No commits found.
                            </p>
                        )}

                        {hasNextPage && !timelineLoading && (
                            <button
                                onClick={() =>
                                    loadTimeline(timelinePage + 1, true)
                                }
                                className="mt-3 w-full rounded-lg border border-white/10 py-3 text-sm font-medium text-slate-300 transition hover:border-indigo-400 hover:text-white"
                            >
                                Load More Commits
                            </button>
                        )}

                        {!hasNextPage && timeline.length > 0 && (
                            <p className="pt-3 text-center text-xs text-slate-500">
                                You've reached the end of the timeline.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* PROFILE MODAL */}
            {(profileLoading || selectedContributor) && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onClick={() => {
                        setSelectedContributor(null);
                    }}
                >
                    <div
                        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {profileLoading ? (
                            <p className="py-10 text-center text-sm text-slate-400">
                                Loading GitHub profile...
                            </p>
                        ) : (
                            <>
                                <div className="flex items-start justify-between">
                                    <h3 className="font-semibold text-white">
                                        Contributor Profile
                                    </h3>
                                    <button
                                        onClick={() =>
                                            setSelectedContributor(null)
                                        }
                                        className="text-xl text-slate-400 hover:text-white"
                                        aria-label="Close profile"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="mt-6 flex items-center gap-4">
                                    <img
                                        src={selectedContributor.avatarUrl}
                                        alt=""
                                        className="h-16 w-16 rounded-full"
                                    />
                                    <div className="min-w-0">
                                        <h4 className="text-lg font-bold text-white">
                                            {selectedContributor.name ||
                                                selectedContributor.username}
                                        </h4>
                                        <p className="text-sm text-indigo-300">
                                            @{selectedContributor.username}
                                        </p>
                                    </div>
                                </div>

                                {selectedContributor.bio && (
                                    <p className="mt-4 text-sm leading-relaxed text-slate-300">
                                        {selectedContributor.bio}
                                    </p>
                                )}

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    {[
                                        ["Followers", selectedContributor.followers],
                                        ["Following", selectedContributor.following],
                                        ["Public Repositories", selectedContributor.publicRepositories],
                                        ["Public Gists", selectedContributor.publicGists],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="rounded-xl bg-slate-950/60 p-3"
                                        >
                                            <p className="text-xs text-slate-500">
                                                {label}
                                            </p>
                                            <p className="mt-1 font-semibold text-white">
                                                {formatNumber(value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {selectedContributor.location && (
                                    <p className="mt-4 text-sm text-slate-400">
                                        Location: {selectedContributor.location}
                                    </p>
                                )}

                                <a
                                    href={selectedContributor.profileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                                >
                                    Open GitHub Profile ↗
                                </a>
                            </>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}

export default ContributorAnalytics;
