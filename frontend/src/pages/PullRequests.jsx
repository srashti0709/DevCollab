
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const PULL_REQUESTS_PER_PAGE = 10;

function PullRequests() {
    const [repositories, setRepositories] = useState([]);
    const [selectedRepository, setSelectedRepository] = useState("");
    const [pullRequests, setPullRequests] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingRepositories, setLoadingRepositories] = useState(true);
    const [loadingPullRequests, setLoadingPullRequests] = useState(false);
    const [error, setError] = useState("");

    const [authorFilter, setAuthorFilter] = useState("ALL");
    const [reviewerFilter, setReviewerFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [draftFilter, setDraftFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");

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
            setPullRequests([]);
            return;
        }

        const fetchPullRequests = async () => {
            setLoadingPullRequests(true);
            setError("");
            setCurrentPage(1);

            try {
                const response = await fetch(
                    `/api/github/repositories/${selectedRepository}/pull-requests`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to fetch pull requests."
                    );
                }

                setPullRequests(data.pullRequests || []);
            } catch (err) {
                setError(err.message);
                setPullRequests([]);
            } finally {
                setLoadingPullRequests(false);
            }
        };

        fetchPullRequests();
    }, [selectedRepository]);

    const authors = [
        ...new Set(
            pullRequests
                .map((pullRequest) => pullRequest.author)
                .filter(Boolean)
        ),
    ].sort();

    const reviewers = [
        ...new Set(
            pullRequests.flatMap(
                (pullRequest) => pullRequest.requestedReviewers || []
            )
        ),
    ].sort();

    const filteredPullRequests = pullRequests.filter((pullRequest) => {
        const query = searchQuery.trim().toLowerCase();

        const matchesSearch =
            !query ||
            pullRequest.title?.toLowerCase().includes(query) ||
            String(pullRequest.number).includes(query);

        const matchesAuthor =
            authorFilter === "ALL" ||
            pullRequest.author === authorFilter;

        const matchesReviewer =
            reviewerFilter === "ALL" ||
            (pullRequest.requestedReviewers || []).includes(
                reviewerFilter
            );

        const matchesStatus =
            statusFilter === "ALL" ||
            pullRequest.state === statusFilter;

        const matchesDraft =
            draftFilter === "ALL" ||
            (draftFilter === "DRAFT" && pullRequest.isDraft) ||
            (draftFilter === "NON_DRAFT" && !pullRequest.isDraft);

        return (
            matchesSearch &&
            matchesAuthor &&
            matchesReviewer &&
            matchesStatus &&
            matchesDraft
        );
    });

    const totalPages = Math.ceil(
        filteredPullRequests.length / PULL_REQUESTS_PER_PAGE
    );

    const startIndex = (currentPage - 1) * PULL_REQUESTS_PER_PAGE;

    const paginatedPullRequests = filteredPullRequests.slice(
        startIndex,
        startIndex + PULL_REQUESTS_PER_PAGE
    );

    const handleRepositoryChange = (event) => {
        setSelectedRepository(event.target.value);
        setCurrentPage(1);
        clearFilters();
    };

    const clearFilters = () => {
        setAuthorFilter("ALL");
        setReviewerFilter("ALL");
        setStatusFilter("ALL");
        setDraftFilter("ALL");
        setSearchQuery("");
        setCurrentPage(1);
    };

    const handleFilterChange = (setter) => (event) => {
        setter(event.target.value);
        setCurrentPage(1);
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

    const hasActiveFilters =
        searchQuery.trim() !== "" ||
        authorFilter !== "ALL" ||
        reviewerFilter !== "ALL" ||
        statusFilter !== "ALL" ||
        draftFilter !== "ALL";

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
                        Pull Requests
                    </h2>

                    <p className="mt-3 text-sm text-slate-400">
                        View and track pull requests from your connected GitHub repositories.
                    </p>
                </section>

                <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold">
                                Repository Pull Requests
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                                Select a repository to view its pull requests.
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

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                        <div>
                            <p className="text-sm font-medium text-slate-300">
                                All Pull Requests
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {filteredPullRequests.length} of {pullRequests.length} pull requests
                            </p>
                        </div>

                        <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300">
                            GitHub synced
                        </span>
                    </div>

                    {loadingRepositories || loadingPullRequests ? (
                        <div className="py-16 text-center text-sm text-slate-400">
                            Loading pull requests...
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
                                Connect a GitHub repository to view its pull requests.
                            </p>
                        </div>
                    ) : pullRequests.length === 0 ? (
                        <div className="py-16 text-center">
                            <h4 className="font-semibold">
                                No pull requests found
                            </h4>
                            <p className="mt-2 text-sm text-slate-400">
                                This repository doesn't have any pull requests yet.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-4">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h4 className="font-semibold text-slate-200">
                                            Search & Filter Pull Requests
                                        </h4>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Search by title or PR number, then narrow results using filters.
                                        </p>
                                    </div>

                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="text-sm font-medium text-indigo-400 transition hover:text-indigo-300"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="prSearch"
                                        className="mb-2 block text-xs font-medium text-slate-400"
                                    >
                                        SEARCH BY TITLE OR PR NUMBER
                                    </label>

                                    <input
                                        id="prSearch"
                                        type="search"
                                        value={searchQuery}
                                        onChange={(event) => {
                                            setSearchQuery(event.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Search pull requests..."
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label
                                            htmlFor="authorFilter"
                                            className="mb-2 block text-xs font-medium text-slate-400"
                                        >
                                            AUTHOR
                                        </label>
                                        <select
                                            id="authorFilter"
                                            value={authorFilter}
                                            onChange={handleFilterChange(setAuthorFilter)}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400"
                                        >
                                            <option value="ALL">All authors</option>
                                            {authors.map((author) => (
                                                <option key={author} value={author}>
                                                    {author}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="reviewerFilter"
                                            className="mb-2 block text-xs font-medium text-slate-400"
                                        >
                                            REQUESTED REVIEWER
                                        </label>
                                        <select
                                            id="reviewerFilter"
                                            value={reviewerFilter}
                                            onChange={handleFilterChange(setReviewerFilter)}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400"
                                        >
                                            <option value="ALL">All reviewers</option>
                                            {reviewers.map((reviewer) => (
                                                <option key={reviewer} value={reviewer}>
                                                    {reviewer}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="statusFilter"
                                            className="mb-2 block text-xs font-medium text-slate-400"
                                        >
                                            STATUS
                                        </label>
                                        <select
                                            id="statusFilter"
                                            value={statusFilter}
                                            onChange={handleFilterChange(setStatusFilter)}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400"
                                        >
                                            <option value="ALL">All statuses</option>
                                            <option value="OPEN">Open</option>
                                            <option value="CLOSED">Closed</option>
                                            <option value="MERGED">Merged</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="draftFilter"
                                            className="mb-2 block text-xs font-medium text-slate-400"
                                        >
                                            DRAFT
                                        </label>
                                        <select
                                            id="draftFilter"
                                            value={draftFilter}
                                            onChange={handleFilterChange(setDraftFilter)}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400"
                                        >
                                            <option value="ALL">All pull requests</option>
                                            <option value="DRAFT">Draft only</option>
                                            <option value="NON_DRAFT">Non-draft only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {filteredPullRequests.length === 0 ? (
                                <div className="py-16 text-center">
                                    <h4 className="font-semibold">
                                        No matching pull requests
                                    </h4>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Try changing your search or filters.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="mt-5 divide-y divide-white/10">
                                        {paginatedPullRequests.map((pullRequest) => (
                                            <article
                                                key={pullRequest.githubPrId}
                                                className="py-5 first:pt-2 last:pb-2"
                                            >
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <Link
                                                            to={`/repositories/${selectedRepository}/pull-requests/${pullRequest.number}`}
                                                            className="font-semibold text-slate-100 transition hover:text-indigo-400"
                                                        >
                                                            {pullRequest.title}
                                                        </Link>

                                                        <p className="mt-2 text-xs text-slate-500">
                                                            #{pullRequest.number} · opened by{" "}
                                                            {pullRequest.author || "Unknown"}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
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

                                                        <a
                                                            href={pullRequest.htmlUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                                                        >
                                                            View on GitHub ↗
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                                                    <span>
                                                        {pullRequest.headBranch || "Unknown"} →{" "}
                                                        {pullRequest.baseBranch || "Unknown"}
                                                    </span>

                                                    <span>
                                                        Created:{" "}
                                                        {new Date(
                                                            pullRequest.createdAt
                                                        ).toLocaleDateString()}
                                                    </span>

                                                    <span>
                                                        Updated:{" "}
                                                        {new Date(
                                                            pullRequest.updatedAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </article>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                                        <p className="text-sm text-slate-400">
                                            Showing {startIndex + 1}–
                                            {Math.min(
                                                startIndex + PULL_REQUESTS_PER_PAGE,
                                                filteredPullRequests.length
                                            )}{" "}
                                            of {filteredPullRequests.length} pull requests
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
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}

export default PullRequests;
