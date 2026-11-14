
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Repositories() {
    const [repositories, setRepositories] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState(new Set());
    const [updatingIds, setUpdatingIds] = useState(new Set());
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [comparison, setComparison] = useState([]);
    const [comparisonLoading, setComparisonLoading] = useState(false);
    const [comparisonError, setComparisonError] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [favoriteError, setFavoriteError] = useState("");

    useEffect(() => {
        const fetchRepositories = async () => {
            try {
                setLoading(true);
                setError("");

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

                const favoritesResponse = await fetch(
                    "/api/github/repositories/favorites",
                    { credentials: "include" }
                );

                const favoritesData = await favoritesResponse.json();

                if (favoritesResponse.ok) {
                    setFavoriteIds(
                        new Set(
                            (favoritesData.repositories || []).map(
                                (repository) => repository.id
                            )
                        )
                    );
                } else {
                    setFavoriteError(
                        favoritesData.message ||
                            "Unable to load favorite repositories."
                    );
                }
            } catch (err) {
                setError(err.message || "Unable to load repositories.");
            } finally {
                setLoading(false);
            }
        };

        fetchRepositories();
    }, []);

    const toggleFavorite = async (repositoryId) => {
        if (updatingIds.has(repositoryId)) return;

        const isFavorite = favoriteIds.has(repositoryId);

        setUpdatingIds((current) => new Set(current).add(repositoryId));
        setFavoriteError("");

        try {
            const response = await fetch(
                `/api/github/repositories/${repositoryId}/favorite`,
                {
                    method: isFavorite ? "DELETE" : "POST",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update repository favorite."
                );
            }

            setFavoriteIds((current) => {
                const updated = new Set(current);

                if (isFavorite) {
                    updated.delete(repositoryId);
                } else {
                    updated.add(repositoryId);
                }

                return updated;
            });
        } catch (err) {
            setFavoriteError(
                err.message || "Unable to update repository favorite."
            );
        } finally {
            setUpdatingIds((current) => {
                const updated = new Set(current);
                updated.delete(repositoryId);
                return updated;
            });
        }
    };

    const toggleComparisonSelection = (repositoryId) => {
        setSelectedIds((current) => {
            const updated = new Set(current);

            if (updated.has(repositoryId)) {
                updated.delete(repositoryId);
                setComparison([]);
                setComparisonError("");
                return updated;
            }

            if (updated.size >= 4) return current;

            updated.add(repositoryId);
            setComparison([]);
            setComparisonError("");
            return updated;
        });
    };

    const compareSelectedRepositories = async () => {
        if (selectedIds.size < 2 || selectedIds.size > 4) return;

        try {
            setComparisonLoading(true);
            setComparisonError("");
            setComparison([]);

            const ids = Array.from(selectedIds).join(",");

            const response = await fetch(
                `/api/github/repositories/compare?ids=${encodeURIComponent(ids)}`,
                { credentials: "include" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to compare repositories."
                );
            }

            setComparison(data.repositories || []);
        } catch (err) {
            setComparisonError(
                err.message || "Unable to compare repositories."
            );
        } finally {
            setComparisonLoading(false);
        }
    };

    const clearComparison = () => {
        setSelectedIds(new Set());
        setComparison([]);
        setComparisonError("");
    };

    const filteredRepositories = repositories.filter((repository) => {
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return [
            repository.name,
            repository.fullName,
            repository.description,
            repository.language,
        ].some((value) => value?.toLowerCase().includes(query));
    });

    const comparisonRows = [
        {
            label: "Full Name",
            getValue: (repository) => repository.fullName,
        },
        {
            label: "Description",
            getValue: (repository) =>
                repository.description || "No description",
        },
        {
            label: "Programming Language",
            getValue: (repository) => repository.language || "Not specified",
        },
        {
            label: "Stars",
            getValue: (repository) => repository.stars ?? 0,
        },
        {
            label: "Forks",
            getValue: (repository) => repository.forks ?? 0,
        },
        {
            label: "Visibility",
            getValue: (repository) => repository.visibility,
        },
        {
            label: "Default Branch",
            getValue: (repository) =>
                repository.defaultBranch || "Not set",
        },
    ];

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
                        Repositories
                    </h2>

                    <p className="mt-3 text-sm text-slate-400">
                        Explore repositories connected to your personal workspace.
                    </p>
                </section>

                <section className="mt-8">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Connected Repositories
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                                {filteredRepositories.length} of {repositories.length}{" "}
                                {repositories.length === 1
                                    ? "repository"
                                    : "repositories"}{" "}
                                shown
                            </p>

                            <p className="mt-1 text-sm text-amber-400">
                                ★ {favoriteIds.size} favorite{" "}
                                {favoriteIds.size === 1
                                    ? "repository"
                                    : "repositories"}
                            </p>
                        </div>

                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                            GitHub synced
                        </span>
                    </div>

                    {favoriteError && (
                        <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
                            {favoriteError}
                        </div>
                    )}

                    {!loading && !error && repositories.length > 0 && (
                        <div className="mb-6">
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    ⌕
                                </span>

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search by repository name, description or language..."
                                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    )}

                    {!loading && !error && repositories.length > 0 && (
                        <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-semibold text-white">
                                        Repository Comparison
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Select 2–4 repositories to compare their
                                        statistics and details.
                                    </p>

                                    <p className="mt-2 text-sm text-indigo-300">
                                        {selectedIds.size} of 4 repositories selected
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={clearComparison}
                                        disabled={
                                            selectedIds.size === 0 &&
                                            comparison.length === 0
                                        }
                                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Clear Selection
                                    </button>

                                    <button
                                        type="button"
                                        onClick={compareSelectedRepositories}
                                        disabled={
                                            selectedIds.size < 2 ||
                                            selectedIds.size > 4 ||
                                            comparisonLoading
                                        }
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {comparisonLoading
                                            ? "Comparing..."
                                            : "Compare Repositories"}
                                    </button>
                                </div>
                            </div>

                            {comparisonError && (
                                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                                    {comparisonError}
                                </div>
                            )}

                            {comparison.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="mb-4 text-base font-semibold">
                                        Comparison Results
                                    </h4>

                                    <div className="overflow-x-auto rounded-xl border border-white/10">
                                        <table className="w-full min-w-[650px] text-left text-sm">
                                            <thead className="bg-slate-800/80">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium text-slate-300">
                                                        Feature
                                                    </th>

                                                    {comparison.map((repository) => (
                                                        <th
                                                            key={repository.id}
                                                            className="px-4 py-3 font-medium text-indigo-300"
                                                        >
                                                            {repository.name}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {comparisonRows.map((row) => (
                                                    <tr
                                                        key={row.label}
                                                        className="border-t border-white/10"
                                                    >
                                                        <td className="px-4 py-3 font-medium text-slate-300">
                                                            {row.label}
                                                        </td>

                                                        {comparison.map((repository) => (
                                                            <td
                                                                key={repository.id}
                                                                className="max-w-xs break-words px-4 py-3 text-slate-400"
                                                            >
                                                                {row.getValue(repository)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}

                                                <tr className="border-t border-white/10">
                                                    <td className="px-4 py-3 font-medium text-slate-300">
                                                        GitHub
                                                    </td>

                                                    {comparison.map((repository) => (
                                                        <td
                                                            key={repository.id}
                                                            className="px-4 py-3"
                                                        >
                                                            <a
                                                                href={repository.htmlUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-indigo-400 transition hover:text-indigo-300"
                                                            >
                                                                Open Repository ↗
                                                            </a>
                                                        </td>
                                                    ))}
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-12 text-center text-sm text-slate-400">
                            Loading repositories...
                        </div>
                    ) : error ? (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
                            {error}
                        </div>
                    ) : repositories.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-16 text-center">
                            <div className="text-4xl">◇</div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No repositories connected
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                                Connect a GitHub repository to your workspace
                                to start managing it in DevCollab.
                            </p>
                        </div>
                    ) : filteredRepositories.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-16 text-center">
                            <div className="text-4xl">⌕</div>
                            <h3 className="mt-4 text-lg font-semibold">
                                No matching repositories
                            </h3>
                            <p className="mt-2 text-sm text-slate-400">
                                Try another repository name, description or language.
                            </p>

                            <button
                                onClick={() => setSearch("")}
                                className="mt-5 rounded-lg border border-indigo-500/40 px-4 py-2 text-sm text-indigo-300 transition hover:bg-indigo-500/10"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2">
                            {filteredRepositories.map((repository) => {
                                const isFavorite = favoriteIds.has(repository.id);
                                const isUpdating = updatingIds.has(repository.id);
                                const isSelected = selectedIds.has(repository.id);
                                const selectionLimitReached =
                                    selectedIds.size >= 4 && !isSelected;

                                return (
                                    <article
                                        key={repository.id}
                                        className={`rounded-2xl border bg-slate-900/60 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-950/20 sm:p-6 ${
                                            isSelected
                                                ? "border-indigo-400/60"
                                                : "border-white/10 hover:border-indigo-400/40"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h4 className="break-words text-lg font-semibold text-white">
                                                    {repository.name}
                                                </h4>

                                                <p className="mt-1 break-all text-xs text-slate-500">
                                                    {repository.fullName}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleFavorite(repository.id)
                                                    }
                                                    disabled={isUpdating}
                                                    aria-label={
                                                        isFavorite
                                                            ? "Remove from favorites"
                                                            : "Add to favorites"
                                                    }
                                                    title={
                                                        isFavorite
                                                            ? "Remove from favorites"
                                                            : "Add to favorites"
                                                    }
                                                    className={`rounded-lg border px-3 py-2 text-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        isFavorite
                                                            ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                                                            : "border-slate-700 text-slate-400 hover:border-amber-400/40 hover:text-amber-400"
                                                    }`}
                                                >
                                                    {isUpdating
                                                        ? "..."
                                                        : isFavorite
                                                          ? "★"
                                                          : "☆"}
                                                </button>

                                                <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                                                    {repository.visibility}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="mt-4 min-h-10 text-sm leading-relaxed text-slate-400">
                                            {repository.description ||
                                                "No description provided."}
                                        </p>

                                        <div className="mt-5 flex flex-wrap gap-4 border-t border-white/10 pt-4 text-xs text-slate-400">
                                            {repository.language && (
                                                <span>
                                                    <span className="text-indigo-300">●</span>{" "}
                                                    {repository.language}
                                                </span>
                                            )}

                                            <span>
                                                ★ {repository.stars ?? 0} stars
                                            </span>

                                            <span>
                                                Forks: {repository.forks ?? 0}
                                            </span>
                                        </div>

                                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                                            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={selectionLimitReached}
                                                    onChange={() =>
                                                        toggleComparisonSelection(
                                                            repository.id
                                                        )
                                                    }
                                                    className="h-4 w-4 accent-indigo-500"
                                                />

                                                <span>
                                                    {isSelected
                                                        ? "Selected"
                                                        : "Select to Compare"}
                                                </span>
                                            </label>

                                            <span className="text-xs text-slate-500">
                                                Default: {repository.defaultBranch || "Not set"}
                                            </span>
                                        </div>

                                        <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
                                            <Link
                                                to={`/repositories/${repository.id}`}
                                                className="rounded-lg border border-indigo-500/40 px-4 py-2 text-sm font-medium text-indigo-300 transition hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-white"
                                            >
                                                View Details
                                            </Link>

                                            <a
                                                href={repository.htmlUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                                            >
                                                Open on GitHub ↗
                                            </a>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default Repositories;
