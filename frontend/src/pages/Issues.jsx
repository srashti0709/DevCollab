
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const ISSUES_PER_PAGE = 10;

function Issues() {
    const [repositories, setRepositories] = useState([]);
    const [selectedRepository, setSelectedRepository] = useState("");
    const [issues, setIssues] = useState([]);
    const [issueFilter, setIssueFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingRepositories, setLoadingRepositories] = useState(true);
    const [loadingIssues, setLoadingIssues] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRepositories = async () => {
            try {
                const workspaceResponse = await fetch(
                    "/api/github/workspace/personal",
                    { credentials: "include" }
                );

                const workspaceData = await workspaceResponse.json();

                if (!workspaceResponse.ok) {
                    throw new Error(
                        workspaceData.message || "Unable to load workspace."
                    );
                }

                const response = await fetch(
                    `/api/github/workspaces/${workspaceData.workspace.id}/repositories`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load repositories."
                    );
                }

                setRepositories(data.repositories || []);

                if (data.repositories?.length > 0) {
                    setSelectedRepository(data.repositories[0].id);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoadingRepositories(false);
            }
        };

        fetchRepositories();
    }, []);

    useEffect(() => {
        if (!selectedRepository) {
            return;
        }

        const fetchIssues = async () => {
            setLoadingIssues(true);
            setError("");

            try {
                const response = await fetch(
                    `/api/github/repositories/${selectedRepository}/issues`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to fetch issues."
                    );
                }

                setIssues(data.issues || []);
            } catch (err) {
                setError(err.message);
                setIssues([]);
            } finally {
                setLoadingIssues(false);
            }
        };

        fetchIssues();
    }, [selectedRepository]);

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const filteredIssues = issues.filter((issue) => {
        const matchesStatus =
            issueFilter === "all" || issue.state === issueFilter;

        const searchableText =
            `${issue.title || ""} ${issue.body || ""}`.toLowerCase();

        const matchesSearch =
            !normalizedSearchQuery ||
            searchableText.includes(normalizedSearchQuery);

        return matchesStatus && matchesSearch;
    });

    const sortedIssues = [...filteredIssues].sort((a, b) => {
        switch (sortOrder) {
            case "oldest":
                return new Date(a.createdAt) - new Date(b.createdAt);

            case "recently-updated":
                return new Date(b.updatedAt) - new Date(a.updatedAt);

            case "least-recently-updated":
                return new Date(a.updatedAt) - new Date(b.updatedAt);

            case "newest":
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    const totalPages = Math.ceil(sortedIssues.length / ISSUES_PER_PAGE);

    const startIndex = (currentPage - 1) * ISSUES_PER_PAGE;

    const paginatedIssues = sortedIssues.slice(
        startIndex,
        startIndex + ISSUES_PER_PAGE
    );

    const resetPage = () => {
        setCurrentPage(1);
    };

    const handleRepositoryChange = (event) => {
        setSelectedRepository(event.target.value);
        resetPage();
    };

    const handleFilterChange = (filter) => {
        setIssueFilter(filter);
        resetPage();
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        resetPage();
    };

    const handleSortChange = (event) => {
        setSortOrder(event.target.value);
        resetPage();
    };

    return (
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-10">
            <div className="mx-auto max-w-6xl">
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

                <section className="mt-12">
                    <p className="text-sm font-medium text-indigo-400">
                        GitHub Integration
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                        Issues
                    </h2>

                    <p className="mt-3 text-sm text-slate-400">
                        View and track issues from your connected GitHub repositories.
                    </p>
                </section>

                <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold">Repository Issues</h3>
                            <p className="mt-1 text-sm text-slate-400">
                                Select a repository to view its issues.
                            </p>
                        </div>

                        <div className="w-full sm:w-72">
                            <label
                                htmlFor="repository"
                                className="mb-2 block text-xs font-medium text-slate-400"
                            >
                                SELECT REPOSITORY
                            </label>

                            <select
                                id="repository"
                                value={selectedRepository}
                                onChange={handleRepositoryChange}
                                disabled={
                                    loadingRepositories ||
                                    repositories.length === 0
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400 disabled:opacity-50"
                            >
                                {loadingRepositories ? (
                                    <option value="">Loading repositories...</option>
                                ) : repositories.length === 0 ? (
                                    <option value="">No connected repositories</option>
                                ) : (
                                    repositories.map((repository) => (
                                        <option
                                            key={repository.id}
                                            value={repository.id}
                                        >
                                            {repository.fullName}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                        <div>
                            <p className="text-sm font-medium text-slate-300">
                                All Issues
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {filteredIssues.length} issues found
                            </p>
                        </div>

                        <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                            GitHub synced
                        </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {[
                            { value: "all", label: "All" },
                            { value: "open", label: "Open" },
                            { value: "closed", label: "Closed" },
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => handleFilterChange(filter.value)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    issueFilter === filter.value
                                        ? "bg-indigo-600 text-white"
                                        : "border border-slate-700 bg-slate-800 text-slate-400 hover:border-indigo-400 hover:text-white"
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-5">
                        <label
                            htmlFor="issue-search"
                            className="mb-2 block text-xs font-medium text-slate-400"
                        >
                            SEARCH ISSUES
                        </label>

                        <input
                            id="issue-search"
                            type="search"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by issue title or description..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-400"
                        />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <label
                            htmlFor="issue-sort"
                            className="text-xs font-medium text-slate-400"
                        >
                            SORT ISSUES BY
                        </label>

                        <select
                            id="issue-sort"
                            value={sortOrder}
                            onChange={handleSortChange}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-400"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                            <option value="recently-updated">
                                Recently updated
                            </option>
                            <option value="least-recently-updated">
                                Least recently updated
                            </option>
                        </select>
                    </div>

                    {loadingRepositories || loadingIssues ? (
                        <div className="py-16 text-center text-sm text-slate-400">
                            Loading issues...
                        </div>
                    ) : error ? (
                        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
                            {error}
                        </div>
                    ) : repositories.length === 0 ? (
                        <div className="py-16 text-center">
                            <h4 className="font-semibold">
                                No repositories connected
                            </h4>
                            <p className="mt-2 text-sm text-slate-400">
                                Connect a GitHub repository to view its issues here.
                            </p>
                        </div>
                    ) : issues.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 text-2xl">
                                ✓
                            </div>
                            <h4 className="mt-4 font-semibold">
                                No issues found
                            </h4>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">
                                This repository doesn't have any issues yet. New
                                GitHub issues will appear here when available.
                            </p>
                        </div>
                    ) : filteredIssues.length === 0 ? (
                        <div className="py-16 text-center">
                            <h4 className="font-semibold">
                                {normalizedSearchQuery
                                    ? "No matching issues"
                                    : `No ${issueFilter} issues`}
                            </h4>
                            <p className="mt-2 text-sm text-slate-400">
                                {normalizedSearchQuery
                                    ? "Try a different search term or change the status filter."
                                    : `There are no ${issueFilter} issues in this repository.`}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-5 divide-y divide-white/10">
                                {paginatedIssues.map((issue) => (
                                    <article
                                        key={issue.githubIssueId}
                                        className="py-5 first:pt-2 last:pb-2"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="font-semibold text-slate-100">
                                                    {issue.title}
                                                </h4>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    #{issue.number} · opened by{" "}
                                                    {issue.author || "Unknown"}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-3">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                        issue.state === "open"
                                                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                                            : "border border-violet-500/20 bg-violet-500/10 text-violet-300"
                                                    }`}
                                                >
                                                    {issue.state}
                                                </span>

                                                <Link
                                                    to={`/repositories/${selectedRepository}/issues/${issue.number}`}
                                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                                                >
                                                    View Details
                                                    <span aria-hidden="true">→</span>
                                                </Link>
                                            </div>
                                        </div>

                                        {issue.labels?.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {issue.labels.map((label) => (
                                                    <span
                                                        key={label.id}
                                                        className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300"
                                                        style={{
                                                            borderColor: `#${label.color}66`,
                                                            backgroundColor: `#${label.color}18`,
                                                        }}
                                                    >
                                                        {label.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <p className="mt-3 text-xs text-slate-500">
                                            Updated:{" "}
                                            {new Date(issue.updatedAt).toLocaleDateString()}
                                        </p>
                                    </article>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                                <p className="text-sm text-slate-400">
                                    Showing {startIndex + 1}–
                                    {Math.min(
                                        startIndex + ISSUES_PER_PAGE,
                                        sortedIssues.length
                                    )}{" "}
                                    of {sortedIssues.length} issues
                                </p>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((page) => page - 1)
                                        }
                                        disabled={currentPage === 1}
                                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-slate-400">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((page) => page + 1)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}

export default Issues;
    