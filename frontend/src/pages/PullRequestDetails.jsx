
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function PullRequestDetails() {
    const { repositoryId, pullRequestNumber } = useParams();

    const [pullRequest, setPullRequest] = useState(null);
    const [repository, setRepository] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [reviewError, setReviewError] = useState("");

    const [timeline, setTimeline] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(true);
    const [timelineError, setTimelineError] = useState("");

    const [linkedIssues, setLinkedIssues] = useState([]);
    const [loadingLinkedIssues, setLoadingLinkedIssues] = useState(true);
    const [linkedIssuesError, setLinkedIssuesError] = useState("");

    useEffect(() => {
        const fetchPullRequestDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/github/repositories/${repositoryId}/pull-requests/${pullRequestNumber}`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load pull request details."
                    );
                }

                setPullRequest(data.pullRequest);
                setRepository(data.repository);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPullRequestDetails();
    }, [repositoryId, pullRequestNumber]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoadingReviews(true);
                setReviewError("");

                const response = await fetch(
                    `/api/github/repositories/${repositoryId}/pull-requests/${pullRequestNumber}/reviews`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load reviews."
                    );
                }

                setReviews(data.reviews || []);
            } catch (err) {
                setReviewError(err.message);
            } finally {
                setLoadingReviews(false);
            }
        };

        fetchReviews();
    }, [repositoryId, pullRequestNumber]);

    useEffect(() => {
        const fetchTimeline = async () => {
            try {
                setLoadingTimeline(true);
                setTimelineError("");

                const response = await fetch(
                    `/api/github/repositories/${repositoryId}/pull-requests/${pullRequestNumber}/timeline`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load pull request timeline."
                    );
                }

                setTimeline(
                    (data.timeline || []).sort(
                        (a, b) =>
                            new Date(a.createdAt) - new Date(b.createdAt)
                    )
                );
            } catch (err) {
                setTimelineError(err.message);
            } finally {
                setLoadingTimeline(false);
            }
        };

        fetchTimeline();
    }, [repositoryId, pullRequestNumber]);

    useEffect(() => {
        const fetchLinkedIssues = async () => {
            try {
                setLoadingLinkedIssues(true);
                setLinkedIssuesError("");

                const response = await fetch(
                    `/api/github/repositories/${repositoryId}/pull-requests/${pullRequestNumber}/linked-issues`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load linked issues."
                    );
                }

                setLinkedIssues(data.linkedIssues || []);
            } catch (err) {
                setLinkedIssuesError(err.message);
            } finally {
                setLoadingLinkedIssues(false);
            }
        };

        fetchLinkedIssues();
    }, [repositoryId, pullRequestNumber]);

    const formatDate = (date) => {
        if (!date) return "Not available";
        return new Date(date).toLocaleString();
    };

    const getStatusStyle = (state) => {
        switch (state) {
            case "OPEN":
                return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
            case "MERGED":
                return "border-violet-500/20 bg-violet-500/10 text-violet-300";
            case "CLOSED":
                return "border-red-500/20 bg-red-500/10 text-red-400";
            default:
                return "border-slate-700 bg-slate-800 text-slate-300";
        }
    };

    const getReviewStyle = (state) => {
        switch (state) {
            case "APPROVED":
                return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
            case "CHANGES_REQUESTED":
                return "border-red-500/20 bg-red-500/10 text-red-400";
            case "COMMENTED":
                return "border-indigo-500/20 bg-indigo-500/10 text-indigo-300";
            case "DISMISSED":
                return "border-slate-700 bg-slate-800 text-slate-400";
            default:
                return "border-slate-700 bg-slate-800 text-slate-300";
        }
    };

    const getTimelineDescription = (event) => {
        switch (event.event) {
            case "opened":
                return "opened this pull request";
            case "closed":
                return "closed this pull request";
            case "reopened":
                return "reopened this pull request";
            case "merged":
                return "merged this pull request";
            case "committed":
                return "pushed a commit";
            case "reviewed":
                return `submitted a review${event.review?.state ? `: ${event.review.state.replaceAll("_", " ").toLowerCase()}` : ""}`;
            case "review_requested":
                return `requested a review from ${event.requestedReviewer || event.requestedTeam || "a reviewer"}`;
            case "review_request_removed":
                return `removed a review request for ${event.requestedReviewer || event.requestedTeam || "a reviewer"}`;
            case "assigned":
                return `assigned ${event.assignee || "a user"}`;
            case "unassigned":
                return `unassigned ${event.assignee || "a user"}`;
            case "labeled":
                return `added label "${event.label || "Unknown"}"`;
            case "unlabeled":
                return `removed label "${event.label || "Unknown"}"`;
            case "ready_for_review":
                return "marked this pull request ready for review";
            case "converted_to_draft":
                return "converted this pull request to a draft";
            case "review_dismissed":
                return "dismissed a review";
            case "renamed":
                return "renamed this pull request";
            case "milestoned":
                return `added milestone "${event.milestone || "Unknown"}"`;
            case "demilestoned":
                return `removed milestone "${event.milestone || "Unknown"}"`;
            default:
                return event.event
                    ? event.event.replaceAll("_", " ")
                    : "updated this pull request";
        }
    };

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
                        to="/pull-requests"
                        className="text-sm text-indigo-400 transition hover:text-indigo-300"
                    >
                        ← Back to Pull Requests
                    </Link>
                </div>

                {loading ? (
                    <div className="py-24 text-center text-sm text-slate-400">
                        Loading pull request details...
                    </div>
                ) : error ? (
                    <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
                        {error}
                    </div>
                ) : pullRequest && (
                    <>
                        <section className="mt-8">
                            <p className="text-sm text-indigo-400">
                                {repository?.name}
                            </p>

                            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                                {pullRequest.title}
                            </h2>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <span
                                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                                        pullRequest.state
                                    )}`}
                                >
                                    {pullRequest.state}
                                </span>

                                {pullRequest.isDraft && (
                                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                                        Draft
                                    </span>
                                )}

                                <span className="text-sm text-slate-400">
                                    #{pullRequest.number}
                                </span>

                                <span className="text-sm text-slate-500">
                                    Opened by {pullRequest.author || "Unknown"}
                                </span>
                            </div>
                        </section>

                        <div className="mt-8 grid gap-6 lg:grid-cols-3">
                            <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur lg:col-span-2">
                                <h3 className="font-semibold">Description</h3>

                                <div className="mt-4 min-h-32 max-w-none break-words text-sm leading-7 text-slate-300 [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-3 [&_strong]:font-bold [&_strong]:text-white [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_li]:pl-1 [&_a]:text-indigo-400 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400 [&_code]:rounded [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:text-indigo-300 [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-950 [&_pre]:p-4">
                                    {pullRequest.body ? (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            skipHtml
                                        >
                                            {pullRequest.body}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-slate-500">
                                            No description provided.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-8 border-t border-white/10 pt-5">
                                    <h3 className="font-semibold">
                                        Branch Information
                                    </h3>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                                            <p className="text-xs text-slate-500">
                                                Source Branch
                                            </p>
                                            <p className="mt-2 break-all text-sm text-slate-200">
                                                {pullRequest.headBranch || "Unknown"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                                            <p className="text-xs text-slate-500">
                                                Target Branch
                                            </p>
                                            <p className="mt-2 break-all text-sm text-slate-200">
                                                {pullRequest.baseBranch || "Unknown"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 border-t border-white/10 pt-5">
                                    <h3 className="font-semibold">
                                        Change Summary
                                    </h3>

                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {[
                                            {
                                                label: "Commits",
                                                value: pullRequest.commits,
                                            },
                                            {
                                                label: "Files Changed",
                                                value: pullRequest.changedFiles,
                                            },
                                            {
                                                label: "Additions",
                                                value: pullRequest.additions,
                                            },
                                            {
                                                label: "Deletions",
                                                value: pullRequest.deletions,
                                            },
                                        ].map((item) => (
                                            <div
                                                key={item.label}
                                                className="rounded-xl border border-white/10 bg-slate-950/60 p-4"
                                            >
                                                <p className="text-xs text-slate-500">
                                                    {item.label}
                                                </p>
                                                <p className="mt-2 text-xl font-bold text-slate-100">
                                                    {item.value ?? "—"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <aside className="space-y-5">
                                <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                                    <h3 className="font-semibold">Author</h3>

                                    <div className="mt-4 flex items-center gap-3">
                                        {pullRequest.authorAvatar ? (
                                            <img
                                                src={pullRequest.authorAvatar}
                                                alt=""
                                                className="h-10 w-10 rounded-full"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                                                {pullRequest.author?.charAt(0).toUpperCase() || "?"}
                                            </div>
                                        )}

                                        <span className="text-sm text-slate-300">
                                            {pullRequest.author || "Unknown"}
                                        </span>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                                    <h3 className="font-semibold">
                                        Pull Request Information
                                    </h3>

                                    <div className="mt-4 space-y-4 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Created
                                            </p>
                                            <p className="mt-1 text-slate-300">
                                                {formatDate(pullRequest.createdAt)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Last Updated
                                            </p>
                                            <p className="mt-1 text-slate-300">
                                                {formatDate(pullRequest.updatedAt)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Closed
                                            </p>
                                            <p className="mt-1 text-slate-300">
                                                {formatDate(pullRequest.closedAt)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Merged
                                            </p>
                                            <p className="mt-1 text-slate-300">
                                                {formatDate(pullRequest.mergedAt)}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <a
                                    href={pullRequest.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-lg bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-400"
                                >
                                    View on GitHub ↗
                                </a>
                            </aside>
                        </div>

                        {/* Linked Issues */}
                        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Linked Issues
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-400">
                                        Issues referenced by closing keywords in this pull request
                                    </p>
                                </div>

                                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                    {linkedIssues.length} issues
                                </span>
                            </div>

                            {loadingLinkedIssues ? (
                                <p className="py-10 text-center text-sm text-slate-400">
                                    Loading linked issues...
                                </p>
                            ) : linkedIssuesError ? (
                                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                                    {linkedIssuesError}
                                </div>
                            ) : linkedIssues.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="font-medium text-slate-300">
                                        No linked issues found
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Add a reference such as Fixes #12, Closes #12, or Resolves #12 to the pull request description to link an issue.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-3">
                                    {linkedIssues.map((issue) => (
                                        <article
                                            key={issue.githubIssueId}
                                            className="rounded-xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-indigo-500/30"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <a
                                                        href={issue.htmlUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="break-words text-sm font-semibold text-slate-200 transition hover:text-indigo-400"
                                                    >
                                                        #{issue.number} {issue.title}
                                                    </a>

                                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                        <span>
                                                            Opened by {issue.author || "Unknown"}
                                                        </span>
                                                        <span>·</span>
                                                        <span>
                                                            Updated {formatDate(issue.updatedAt)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                                                        issue.state
                                                    )}`}
                                                >
                                                    {issue.state}
                                                </span>
                                            </div>

                                            {issue.labels?.length > 0 && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {issue.labels.map((label) => (
                                                        <span
                                                            key={label.name}
                                                            className="rounded-full border px-2.5 py-1 text-xs"
                                                            style={{
                                                                borderColor: `#${label.color}55`,
                                                                backgroundColor: `#${label.color}18`,
                                                                color: `#${label.color}`,
                                                            }}
                                                        >
                                                            {label.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Reviews */}
                        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Reviews
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-400">
                                        GitHub reviews and reviewer feedback
                                    </p>
                                </div>

                                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                    {reviews.length} reviews
                                </span>
                            </div>

                            {loadingReviews ? (
                                <p className="py-10 text-center text-sm text-slate-400">
                                    Loading reviews...
                                </p>
                            ) : reviewError ? (
                                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                                    {reviewError}
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="font-medium text-slate-300">
                                        No reviews yet
                                    </p>
                                    <p className="mt-2 text-sm text-slate-500">
                                        No submitted reviews are available for this pull request.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 divide-y divide-white/10">
                                    {reviews.map((review) => (
                                        <article
                                            key={review.id}
                                            className="py-5 first:pt-2 last:pb-2"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    {review.reviewerAvatar ? (
                                                        <img
                                                            src={review.reviewerAvatar}
                                                            alt=""
                                                            className="h-10 w-10 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                                                            {review.reviewer?.charAt(0).toUpperCase() || "?"}
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="text-sm font-medium text-slate-200">
                                                            {review.reviewer || "Unknown reviewer"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {formatDate(review.submittedAt)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getReviewStyle(
                                                        review.state
                                                    )}`}
                                                >
                                                    {review.state.replaceAll("_", " ")}
                                                </span>
                                            </div>

                                            <div className="mt-4 break-words text-sm leading-6 text-slate-300">
                                                {review.body ? (
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        skipHtml
                                                    >
                                                        {review.body}
                                                    </ReactMarkdown>
                                                ) : (
                                                    <p className="text-slate-500">
                                                        No review comment provided.
                                                    </p>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Activity Timeline */}
                        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Activity Timeline
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-400">
                                        Complete history of pull request activity
                                    </p>
                                </div>

                                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                                    {timeline.length} events
                                </span>
                            </div>

                            {loadingTimeline ? (
                                <p className="py-10 text-center text-sm text-slate-400">
                                    Loading activity timeline...
                                </p>
                            ) : timelineError ? (
                                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                                    {timelineError}
                                </div>
                            ) : timeline.length === 0 ? (
                                <div className="py-10 text-center text-sm text-slate-400">
                                    No activity events available.
                                </div>
                            ) : (
                                <div className="mt-6">
                                    {timeline.map((event, index) => (
                                        <article
                                            key={`${event.id}-${index}`}
                                            className="relative flex gap-4 pb-7 last:pb-0"
                                        >
                                            <div className="relative flex flex-col items-center">
                                                {event.actorAvatar ? (
                                                    <img
                                                        src={event.actorAvatar}
                                                        alt=""
                                                        className="relative z-10 h-9 w-9 rounded-full border border-slate-700"
                                                    />
                                                ) : (
                                                    <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
                                                        {event.actor?.charAt(0).toUpperCase() || "?"}
                                                    </div>
                                                )}

                                                {index !== timeline.length - 1 && (
                                                    <div className="absolute top-10 h-full w-px bg-slate-700" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm text-slate-200">
                                                    <span className="font-semibold text-white">
                                                        {event.actor || "GitHub"}
                                                    </span>{" "}
                                                    {getTimelineDescription(event)}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatDate(event.createdAt)}
                                                </p>

                                                {event.rename && (
                                                    <p className="mt-2 rounded-lg bg-slate-950/70 p-3 text-xs text-slate-400">
                                                        {event.rename.from} → {event.rename.to}
                                                    </p>
                                                )}

                                                {event.comment?.body && (
                                                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            skipHtml
                                                        >
                                                            {event.comment.body}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}

                                                {event.review?.body && (
                                                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
                                                        <p className="mb-2 text-xs font-semibold text-indigo-300">
                                                            Review feedback
                                                        </p>
                                                        <ReactMarkdown
                                                            remarkPlugins={[remarkGfm]}
                                                            skipHtml
                                                        >
                                                            {event.review.body}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}

                                                {event.commitId && (
                                                    <p className="mt-2 break-all font-mono text-xs text-indigo-400">
                                                        Commit: {event.commitId.slice(0, 12)}
                                                    </p>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}

export default PullRequestDetails;
