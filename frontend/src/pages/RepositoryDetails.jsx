
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ContributorAnalytics from "../components/ContributorAnalytics";

function RepositoryDetails() {
    const { repositoryId } = useParams();

    const [repository, setRepository] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRepository = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/github/repositories/${repositoryId}`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load repository details."
                    );
                }

                setRepository(data.repository);
            } catch (err) {
                setError(err.message || "Unable to load repository details.");
            } finally {
                setLoading(false);
            }
        };

        fetchRepository();
    }, [repositoryId]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
                Loading repository details...
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
                <div className="mx-auto max-w-5xl rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
                    {error}
                    <Link
                        to="/repositories"
                        className="mt-4 block text-sm text-indigo-300 hover:text-indigo-200"
                    >
                        Back to repositories
                    </Link>
                </div>
            </main>
        );
    }

    if (!repository) return null;

    const statistics = [
        { label: "Issues", value: repository.statistics?.issues ?? 0 },
        {
            label: "Pull Requests",
            value: repository.statistics?.pullRequests ?? 0,
        },
        {
            label: "Contribution Events",
            value: repository.statistics?.contributionEvents ?? 0,
        },
    ];

    const details = [
        {
            label: "Programming Language",
            value: repository.language || "Not specified",
        },
        {
            label: "Visibility",
            value: repository.visibility || "Not specified",
        },
        {
            label: "Default Branch",
            value: repository.defaultBranch || "Not specified",
        },
        { label: "Stars", value: repository.stars ?? 0 },
        { label: "Forks", value: repository.forks ?? 0 },
        {
            label: "GitHub Account",
            value: repository.installation?.accountLogin || "Not available",
        },
        {
            label: "Account Type",
            value: repository.installation?.accountType || "Not available",
        },
    ];

    return (
        <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-10">
            <div className="mx-auto max-w-6xl">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold">DevCollab</h1>
                        <p className="text-xs text-slate-400">
                            Repository Management
                        </p>
                    </div>

                    <Link
                        to="/repositories"
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-indigo-400 hover:text-white"
                    >
                        Back to Repositories
                    </Link>
                </header>

                <section className="mt-12 rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-indigo-400">
                                GitHub Repository
                            </p>

                            <h2 className="mt-2 break-words text-3xl font-bold sm:text-4xl">
                                {repository.name}
                            </h2>

                            <p className="mt-2 break-all text-sm text-slate-400">
                                {repository.fullName}
                            </p>
                        </div>

                        <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300">
                            {repository.visibility}
                        </span>
                    </div>

                    <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-300">
                        {repository.description || "No description provided."}
                    </p>

                    <div className="mt-7 flex flex-wrap gap-3">
                        <a
                            href={repository.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                        >
                            Open on GitHub ↗
                        </a>
                    </div>
                </section>

                <section className="mt-8">
                    <h3 className="text-lg font-semibold">
                        Repository Statistics
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        {statistics.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-white/10 bg-slate-900/60 p-6"
                            >
                                <p className="text-sm text-slate-400">
                                    {item.label}
                                </p>
                                <p className="mt-3 text-3xl font-bold text-indigo-300">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-8">
                    <h3 className="text-lg font-semibold">
                        Repository Information
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {details.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-xl border border-white/10 bg-slate-900/60 p-5"
                            >
                                <p className="text-xs text-slate-500">
                                    {item.label}
                                </p>
                                <p className="mt-2 break-words text-sm font-medium text-slate-200">
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-8">
                    <h3 className="text-lg font-semibold">
                        Connected Workspaces
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {repository.workspaces?.length > 0 ? (
                            repository.workspaces.map((workspace) => (
                                <div
                                    key={workspace.id}
                                    className="rounded-xl border border-white/10 bg-slate-900/60 p-5"
                                >
                                    <p className="font-medium text-white">
                                        {workspace.name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {workspace.type}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400">
                                No workspace information available.
                            </p>
                        )}
                    </div>
                </section>

                {/* Phase 9: Contributor Analytics */}
                <ContributorAnalytics repositoryId={repositoryId} />
            </div>
        </main>
    );
}

export default RepositoryDetails;
