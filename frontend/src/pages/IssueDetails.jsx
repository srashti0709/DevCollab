
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function IssueDetails() {
    const { repositoryId, issueNumber } = useParams();

    const [issue, setIssue] = useState(null);
    const [repository, setRepository] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timelineLoading, setTimelineLoading] = useState(true);
    const [timelineError, setTimelineError] = useState("");
    const [error, setError] = useState("");

    const [isSaved, setIsSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveError, setSaveError] = useState("");

    useEffect(() => {
        const fetchIssueDetails = async () => {
            try {
                const response = await fetch(
                    `/api/github/repositories/${repositoryId}/issues/${issueNumber}`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load issue details."
                    );
                }

                setIssue(data.issue);
                setRepository(data.repository);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchIssueDetails();
    }, [repositoryId, issueNumber]);

    useEffect(() => {
        const fetchIssueTimeline = async () => {
            try {
                setTimelineLoading(true);
                setTimelineError("");

                const response = await fetch(
                    `/api/github/repositories/${repositoryId}/issues/${issueNumber}/timeline`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load issue activity."
                    );
                }

                setTimeline(data.timeline || []);
            } catch (err) {
                setTimelineError(err.message);
            } finally {
                setTimelineLoading(false);
            }
        };

        fetchIssueTimeline();
    }, [repositoryId, issueNumber]);

    // Check whether this issue is already saved.
    useEffect(() => {
        const checkSavedIssue = async () => {
            try {
                const response = await fetch(
                    "/api/github/issues/saved",
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to check saved issues."
                    );
                }

                const alreadySaved = (data.issues || []).some(
                    (savedIssue) =>
                        savedIssue.repositoryId === repositoryId &&
                        savedIssue.issueNumber === Number(issueNumber)
                );

                setIsSaved(alreadySaved);
            } catch (err) {
                setSaveError(err.message);
            }
        };

        checkSavedIssue();
    }, [repositoryId, issueNumber]);

    // Save or remove the current issue.
    const handleSaveIssue = async () => {
        try {
            setSaveLoading(true);
            setSaveError("");

            const response = await fetch(
                `/api/github/repositories/${repositoryId}/issues/${issueNumber}/save`,
                {
                    method: isSaved ? "DELETE" : "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update saved issue."
                );
            }

            setIsSaved(!isSaved);
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaveLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "Not available";

        return new Date(date).toLocaleString();
    };

    const getEventDescription = (event) => {
        switch (event.event) {
            case "assigned":
                return `assigned ${event.assignee || "an assignee"}`;

            case "unassigned":
                return `unassigned ${event.assignee || "an assignee"}`;

            case "labeled":
                return `added the label ${event.label || ""}`;

            case "unlabeled":
                return `removed the label ${event.label || ""}`;

            case "closed":
                return "closed this issue";

            case "reopened":
                return "reopened this issue";

            case "milestoned":
                return `added milestone ${event.milestone || ""}`;

            case "demilestoned":
                return `removed milestone ${event.milestone || ""}`;

            case "renamed":
                return "renamed this issue";

            case "mentioned":
                return "mentioned this issue";

            case "referenced":
                return "referenced this issue";

            case "merged":
                return "merged this issue";

            case "locked":
                return "locked this conversation";

            case "unlocked":
                return "unlocked this conversation";

            case "reviewed":
                return "reviewed this issue";

            case "commented":
                return "commented on this issue";

            default:
                return event.event
                    ? event.event.replaceAll("_", " ")
                    : "updated this issue";
        }
    };

    const getEventIcon = (event) => {
        switch (event) {
            case "closed":
                return "✓";
            case "reopened":
                return "↻";
            case "assigned":
                return "👤";
            case "unassigned":
                return "−";
            case "labeled":
            case "unlabeled":
                return "◆";
            case "commented":
                return "💬";
            case "renamed":
                return "✎";
            default:
                return "•";
        }
    };

    const getDisplayTimeline = () => {
        if (!issue) return [];

        const createdEvent = {
            id: "issue-created",
            event: "created",
            actor: issue.author,
            actorAvatar: issue.authorAvatar,
            createdAt: issue.createdAt,
        };

        return [createdEvent, ...timeline].sort(
            (a, b) =>
                new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
    };

    const displayTimeline = getDisplayTimeline();

    return (
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-10">
            <div className="mx-auto max-w-5xl">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-mono font-bold">
                            DC
                        </div>

                        <div>
                            <h1 className="text-lg font-bold">DevCollab</h1>
                            <p className="text-xs text-slate-400">
                                Developer Collaboration Platform
                            </p>
                        </div>
                    </div>

                    <Link
                        to="/dashboard"
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-400 hover:text-white"
                    >
                        Back to Dashboard
                    </Link>
                </header>

                <div className="mt-10">
                    <Link
                        to="/issues"
                        className="text-sm text-indigo-400 transition hover:text-indigo-300"
                    >
                        ← Back to Issues
                    </Link>
                </div>

                {loading ? (
                    <div className="py-24 text-center text-sm text-slate-400">
                        Loading issue details...
                    </div>
                ) : error ? (
                    <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
                        {error}
                    </div>
                ) : issue && (
                    <>
                        <section className="mt-8">
                            <p className="text-sm text-indigo-400">
                                {repository?.name}
                            </p>

                            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    {issue.title}
                                </h2>

                                <button
                                    type="button"
                                    onClick={handleSaveIssue}
                                    disabled={saveLoading}
                                    className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                        isSaved
                                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-red-500/10 hover:text-red-300"
                                            : "bg-indigo-500 text-white hover:bg-indigo-400"
                                    }`}
                                >
                                    {saveLoading
                                        ? "Updating..."
                                        : isSaved
                                            ? "✓ Saved · Remove"
                                            : "☆ Save Issue"}
                                </button>
                            </div>

                            {saveError && (
                                <p className="mt-3 text-sm text-red-400">
                                    {saveError}
                                </p>
                            )}

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                        issue.state === "open"
                                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                            : "border border-violet-500/20 bg-violet-500/10 text-violet-300"
                                    }`}
                                >
                                    {issue.state}
                                </span>

                                <span className="text-sm text-slate-400">
                                    #{issue.number}
                                </span>

                                <span className="text-sm text-slate-500">
                                    Opened by {issue.author || "Unknown"}
                                </span>
                            </div>
                        </section>

                        <div className="mt-8 grid gap-6 lg:grid-cols-3">
                            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur lg:col-span-2">
                                <h3 className="font-semibold">
                                    Description
                                </h3>

                                <div className="mt-4 min-h-32 max-w-none break-words text-sm leading-7 text-slate-300 [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-3 [&_strong]:font-bold [&_strong]:text-white [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li]:pl-1 [&_a]:text-indigo-400 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400 [&_code]:rounded [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:text-indigo-300 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-4">
                                    {issue.body ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            skipHtml
                                        >
                                            {issue.body}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-slate-500">
                                            No description provided.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-8 border-t border-white/10 pt-5">
                                    <h3 className="font-semibold">
                                        Labels
                                    </h3>

                                    {issue.labels?.length > 0 ? (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {issue.labels.map((label) => (
                                                <span
                                                    key={label.id}
                                                    className="rounded-full border px-3 py-1 text-xs text-slate-200"
                                                    style={{
                                                        borderColor: `#${label.color}80`,
                                                        backgroundColor: `#${label.color}20`,
                                                    }}
                                                >
                                                    {label.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm text-slate-500">
                                            No labels assigned.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-8 border-t border-white/10 pt-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h3 className="font-semibold">
                                            Activity Timeline
                                        </h3>

                                        <span className="text-xs text-slate-500">
                                            {displayTimeline.length} events
                                        </span>
                                    </div>

                                    {timelineLoading ? (
                                        <p className="mt-5 text-sm text-slate-400">
                                            Loading activity...
                                        </p>
                                    ) : timelineError ? (
                                        <p className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                                            {timelineError}
                                        </p>
                                    ) : displayTimeline.length > 0 ? (
                                        <div className="mt-6 space-y-6">
                                            {displayTimeline.map((event) => (
                                                <div
                                                    key={event.id}
                                                    className="relative flex gap-4"
                                                >
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-sm text-indigo-300">
                                                        {getEventIcon(event.event)}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm text-slate-300">
                                                            <span className="font-semibold text-white">
                                                                {event.actor || "Unknown"}
                                                            </span>{" "}
                                                            {event.event === "created"
                                                                ? "created this issue"
                                                                : getEventDescription(event)}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {formatDate(event.createdAt)}
                                                        </p>

                                                        {event.label && (
                                                            <span
                                                                className="mt-2 inline-block rounded-full border px-2.5 py-1 text-xs"
                                                                style={{
                                                                    borderColor: `#${event.labelColor || "64748b"}80`,
                                                                    backgroundColor: `#${event.labelColor || "64748b"}20`,
                                                                }}
                                                            >
                                                                {event.label}
                                                            </span>
                                                        )}

                                                        {event.comment?.body && (
                                                            <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm leading-6 text-slate-300">
                                                                {event.comment.body}
                                                                {event.comment.htmlUrl && (
                                                                    <a
                                                                        href={event.comment.htmlUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="mt-2 block text-xs text-indigo-400 hover:text-indigo-300"
                                                                    >
                                                                        View comment on GitHub →
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}

                                                        {event.rename && (
                                                            <p className="mt-2 text-xs text-slate-400">
                                                                {event.rename.from} → {event.rename.to}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-4 text-sm text-slate-500">
                                            No activity available yet.
                                        </p>
                                    )}

                                    <p className="mt-6 text-xs text-slate-500">
                                        {issue.comments} comments recorded on GitHub.
                                    </p>
                                </div>
                            </section>

                            <aside className="space-y-5">
                                <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                                    <h3 className="font-semibold">
                                        Assignees
                                    </h3>

                                    {issue.assignees.length > 0 ? (
                                        <div className="mt-4 space-y-3">
                                            {issue.assignees.map((assignee) => (
                                                <div
                                                    key={assignee.login}
                                                    className="flex items-center gap-3"
                                                >
                                                    {assignee.avatarUrl ? (
                                                        <img
                                                            src={assignee.avatarUrl}
                                                            alt=""
                                                            className="h-8 w-8 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs">
                                                            {assignee.login.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}

                                                    <span className="text-sm text-slate-300">
                                                        {assignee.login}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm text-slate-500">
                                            No assignees.
                                        </p>
                                    )}
                                </section>

                                <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                                    <h3 className="font-semibold">
                                        Issue Information
                                    </h3>

                                    <div className="mt-4 space-y-4 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Created
                                            </p>
                                            <p className="mt-1 text-slate-300">
                                                {formatDate(issue.createdAt)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Last Updated
                                            </p>
                                            <p className="mt-1 text-slate-300">
                                                {formatDate(issue.updatedAt)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Closed
                                            </p>
                                            <p className="mt-1 text-slate-300">
                                                {formatDate(issue.closedAt)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Milestone
                                            </p>
                                            <p className="mt-1 text-slate-300">
                                                {issue.milestone || "None"}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <a
                                    href={issue.htmlUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block rounded-lg bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-400"
                                >
                                    View on GitHub →
                                </a>
                            </aside>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}

export default IssueDetails;
