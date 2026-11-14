
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function SavedIssues() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState(null);

    const fetchSavedIssues = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/github/issues/saved", {
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to fetch saved issues.");
            }

            setIssues(data.issues || []);
        } catch (err) {
            setError(err.message || "Unable to fetch saved issues.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedIssues();
    }, []);

    const handleRemove = async (issue) => {
        const key = `${issue.repositoryId}-${issue.issueNumber}`;

        try {
            setRemovingId(key);

            const response = await fetch(
                `/api/github/repositories/${issue.repositoryId}/issues/${issue.issueNumber}/save`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to remove saved issue.");
            }

            setIssues((current) =>
                current.filter(
                    (item) =>
                        !(
                            item.repositoryId === issue.repositoryId &&
                            item.issueNumber === issue.issueNumber
                        )
                )
            );
        } catch (err) {
            setError(err.message || "Unable to remove saved issue.");
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-8 text-white sm:px-10">
            <div className="mx-auto max-w-6xl">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-indigo-400">
                            Your workspace
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">
                            Saved Issues
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Keep track of issues you want to revisit.
                        </p>
                    </div>

                    <nav className="flex flex-wrap gap-3">
                        <Link
                            to="/dashboard"
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-400 hover:text-white"
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/issues"
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-400 hover:text-white"
                        >
                            Issues
                        </Link>
                    </nav>
                </header>

                <section className="mt-10">
                    {loading ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center text-slate-400">
                            Loading saved issues...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                            <p className="text-sm text-red-300">{error}</p>
                            <button
                                type="button"
                                onClick={fetchSavedIssues}
                                className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700"
                            >
                                Try again
                            </button>
                        </div>
                    ) : issues.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-16 text-center">
                            <div className="text-4xl">☆</div>
                            <h2 className="mt-4 text-xl font-semibold">
                                No saved issues yet
                            </h2>
                            <p className="mt-2 text-sm text-slate-400">
                                Save issues from their details page and they will appear here.
                            </p>
                            <Link
                                to="/issues"
                                className="mt-6 inline-block rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                            >
                                Browse Issues
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-5 flex items-center justify-between">
                                <p className="text-sm text-slate-400">
                                    {issues.length} saved{" "}
                                    {issues.length === 1 ? "issue" : "issues"}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {issues.map((issue) => {
                                    const key = `${issue.repositoryId}-${issue.issueNumber}`;
                                    const isClosed = issue.state === "CLOSED";

                                    return (
                                        <article
                                            key={issue.id}
                                            className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-indigo-400/40 sm:p-6"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                                                isClosed
                                                                    ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                                                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                                            }`}
                                                        >
                                                            {isClosed ? "Closed" : "Open"}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            #{issue.issueNumber}
                                                        </span>
                                                    </div>

                                                    <Link
                                                        to={`/repositories/${issue.repositoryId}/issues/${issue.issueNumber}`}
                                                        className="mt-3 block text-lg font-semibold text-slate-100 transition hover:text-indigo-300"
                                                    >
                                                        {issue.title}
                                                    </Link>

                                                    <p className="mt-2 text-sm text-slate-400">
                                                        {issue.repository?.fullName || issue.repository?.name || "Repository"}
                                                    </p>

                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Saved{" "}
                                                        {new Date(issue.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 flex-wrap gap-2">
                                                    <a
                                                        href={issue.htmlUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:border-indigo-400 hover:text-white"
                                                    >
                                                        GitHub ↗
                                                    </a>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemove(issue)}
                                                        disabled={removingId === key}
                                                        className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {removingId === key
                                                            ? "Removing..."
                                                            : "Remove"}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}

export default SavedIssues;
