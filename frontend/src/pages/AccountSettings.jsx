
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const defaultPreferences = {
    pullRequestUpdates: true,
    issueUpdates: true,
    repositoryActivity: true,
    workspaceInvitations: true,
};

const preferenceOptions = [
    {
        key: "pullRequestUpdates",
        title: "Pull Request Updates",
        description: "Get notified about pull request activity and updates.",
    },
    {
        key: "issueUpdates",
        title: "Issue Updates",
        description: "Stay informed about issues and their discussions.",
    },
    {
        key: "repositoryActivity",
        title: "Repository Activity",
        description: "Receive updates about activity in connected repositories.",
    },
    {
        key: "workspaceInvitations",
        title: "Workspace Invitations",
        description: "Get notified when someone invites you to a workspace.",
    },
];

function getDeviceName(userAgent = "") {
    let browser = "Unknown browser";
    let operatingSystem = "Unknown device";

    if (userAgent.includes("Edg/")) {
        browser = "Microsoft Edge";
    } else if (userAgent.includes("Firefox/")) {
        browser = "Mozilla Firefox";
    } else if (userAgent.includes("Chrome/")) {
        browser = "Google Chrome";
    } else if (userAgent.includes("Safari/")) {
        browser = "Safari";
    }

    if (userAgent.includes("Windows")) {
        operatingSystem = "Windows";
    } else if (userAgent.includes("Mac OS")) {
        operatingSystem = "macOS";
    } else if (userAgent.includes("Android")) {
        operatingSystem = "Android";
    } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
        operatingSystem = "iOS";
    } else if (userAgent.includes("Linux")) {
        operatingSystem = "Linux";
    }

    return `${browser} on ${operatingSystem}`;
}

function formatDate(date) {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not available";
    }

    return parsedDate.toLocaleString();
}

function AccountSettings() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const githubAccount = user?.githubAccounts?.[0];

    const [preferences, setPreferences] = useState(defaultPreferences);
    const [savedPreferences, setSavedPreferences] =
        useState(defaultPreferences);

    const [loadingPreferences, setLoadingPreferences] = useState(true);
    const [savingPreferences, setSavingPreferences] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [sessionError, setSessionError] = useState("");
    const [sessionSuccess, setSessionSuccess] = useState("");
    const [revokingSessionId, setRevokingSessionId] = useState(null);
    const [revokingOtherSessions, setRevokingOtherSessions] = useState(false);

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                setLoadingPreferences(true);
                setError("");

                const response = await fetch(
                    "/api/auth/notification-preferences",
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to load notification preferences."
                    );
                }

                const loadedPreferences = {
                    ...defaultPreferences,
                    ...data.preferences,
                };

                const savedValues = Object.fromEntries(
                    Object.keys(defaultPreferences).map((key) => [
                        key,
                        loadedPreferences[key],
                    ])
                );

                setPreferences(savedValues);
                setSavedPreferences(savedValues);
            } catch (err) {
                setError(
                    err.message || "Unable to load notification preferences."
                );
            } finally {
                setLoadingPreferences(false);
            }
        };

        fetchPreferences();
    }, []);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setLoadingSessions(true);
                setSessionError("");

                const response = await fetch("/api/auth/sessions", {
                    method: "GET",
                    credentials: "include",
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message || "Unable to retrieve active sessions."
                    );
                }

                setSessions(data.sessions || []);
            } catch (err) {
                setSessionError(
                    err.message || "Unable to retrieve active sessions."
                );
            } finally {
                setLoadingSessions(false);
            }
        };

        fetchSessions();
    }, []);

    const handlePreferenceChange = (key) => {
        setPreferences((current) => ({
            ...current,
            [key]: !current[key],
        }));

        setSuccess("");
        setError("");
    };

    const handleSavePreferences = async () => {
        try {
            setSavingPreferences(true);
            setError("");
            setSuccess("");

            const response = await fetch(
                "/api/auth/notification-preferences",
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(preferences),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to save notification preferences."
                );
            }

            const updatedPreferences = {
                ...defaultPreferences,
                ...data.preferences,
            };

            const savedValues = Object.fromEntries(
                Object.keys(defaultPreferences).map((key) => [
                    key,
                    updatedPreferences[key],
                ])
            );

            setPreferences(savedValues);
            setSavedPreferences(savedValues);

            setSuccess("Your notification preferences have been saved.");
        } catch (err) {
            setError(
                err.message || "Unable to save notification preferences."
            );
        } finally {
            setSavingPreferences(false);
        }
    };

    const handleRevokeSession = async (session) => {
        if (session.isCurrent) return;

        const confirmed = window.confirm(
            "Are you sure you want to sign out this device?"
        );

        if (!confirmed) return;

        try {
            setRevokingSessionId(session.id);
            setSessionError("");
            setSessionSuccess("");

            const response = await fetch(
                `/api/auth/sessions/${encodeURIComponent(session.id)}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to revoke this session.");
            }

            setSessions((current) =>
                current.filter((item) => item.id !== session.id)
            );

            setSessionSuccess("The selected session has been revoked.");
        } catch (err) {
            setSessionError(
                err.message || "Unable to revoke this session."
            );
        } finally {
            setRevokingSessionId(null);
        }
    };

    const handleRevokeOtherSessions = async () => {
        const otherSessions = sessions.filter((session) => !session.isCurrent);

        if (otherSessions.length === 0) return;

        const confirmed = window.confirm(
            `This will sign out ${otherSessions.length} other session(s). Your current session will remain active. Continue?`
        );

        if (!confirmed) return;

        try {
            setRevokingOtherSessions(true);
            setSessionError("");
            setSessionSuccess("");

            const response = await fetch("/api/auth/sessions", {
                method: "DELETE",
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Unable to revoke other sessions."
                );
            }

            setSessions((current) =>
                current.filter((session) => session.isCurrent)
            );

            setSessionSuccess(
                `${data.revokedCount} other session(s) have been revoked.`
            );
        } catch (err) {
            setSessionError(
                err.message || "Unable to revoke other sessions."
            );
        } finally {
            setRevokingOtherSessions(false);
        }
    };
    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== "DELETE") {
            setDeleteError('Please type "DELETE" to confirm.');
            return;
        }

        try {
            setDeletingAccount(true);
            setDeleteError("");

            const response = await fetch("/api/auth/account", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    confirmation: "DELETE",
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to delete your account.");
            }

            setUser(null);
            navigate("/", { replace: true });
        } catch (err) {
            setDeleteError(
                err.message || "Something went wrong while deleting your account."
            );
        } finally {
            setDeletingAccount(false);
        }
    };

    const hasChanges = Object.keys(defaultPreferences).some(
        (key) => preferences[key] !== savedPreferences[key]
    );

    const otherSessionsCount = sessions.filter(
        (session) => !session.isCurrent
    ).length;

    return (
        <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
            <div className="mx-auto max-w-4xl">
                <Link
                    to="/dashboard"
                    className="text-sm text-indigo-400 transition hover:text-indigo-300"
                >
                    ← Back to Dashboard
                </Link>

                <header className="mt-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Account Settings
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Manage your DevCollab account and connected services.
                    </p>
                </header>

                {/* Connected GitHub Account */}
                <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Connected GitHub Account
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Your GitHub identity used to sign in to DevCollab.
                            </p>
                        </div>

                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                            {githubAccount ? "Connected" : "Not connected"}
                        </span>
                    </div>

                    {githubAccount ? (
                        <div className="mt-7 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                            <img
                                src={user.avatarUrl}
                                alt="GitHub profile"
                                className="size-14 rounded-full border border-slate-700 object-cover"
                            />

                            <div className="min-w-0">
                                <p className="font-semibold">
                                    {user.githubName || user.displayName}
                                </p>

                                <p className="mt-1 truncate text-sm text-slate-400">
                                    @{githubAccount.githubUsername}
                                </p>
                            </div>

                            <span className="ml-auto hidden text-xs text-emerald-400 sm:block">
                                Active connection
                            </span>
                        </div>
                    ) : (
                        <p className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-400">
                            No GitHub account is currently connected.
                        </p>
                    )}
                </section>

                {/* Notification Preferences */}
                <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Notification Preferences
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Choose which DevCollab activities you want to receive
                            notifications about.
                        </p>
                    </div>

                    {loadingPreferences ? (
                        <p className="mt-8 text-sm text-slate-400">
                            Loading notification preferences...
                        </p>
                    ) : (
                        <>
                            <div className="mt-7 divide-y divide-slate-800">
                                {preferenceOptions.map((option) => (
                                    <label
                                        key={option.key}
                                        className="flex cursor-pointer items-center justify-between gap-5 py-5 first:pt-0 last:pb-0"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-100">
                                                {option.title}
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                {option.description}
                                            </p>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={preferences[option.key]}
                                            onChange={() =>
                                                handlePreferenceChange(option.key)
                                            }
                                            className="size-5 shrink-0 cursor-pointer accent-indigo-500"
                                        />
                                    </label>
                                ))}
                            </div>

                            <div className="mt-7 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-slate-100">
                                            Security Alerts
                                        </p>

                                        <p className="mt-1 text-sm text-slate-400">
                                            Important account security notifications are
                                            always enabled.
                                        </p>
                                    </div>

                                    <span
                                        role="checkbox"
                                        aria-checked="true"
                                        aria-label="Security alerts always enabled"
                                        className="flex size-5 shrink-0 items-center justify-center rounded border border-emerald-500 bg-emerald-500 text-sm font-bold text-white"
                                    >
                                        ✓
                                    </span>
                                </div>
                            </div>

                            {error && (
                                <p
                                    role="alert"
                                    className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
                                >
                                    {error}
                                </p>
                            )}

                            {success && (
                                <p
                                    role="status"
                                    className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400"
                                >
                                    {success}
                                </p>
                            )}

                            <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                                <p className="text-xs text-slate-500">
                                    Changes are applied when you save.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleSavePreferences}
                                    disabled={!hasChanges || savingPreferences}
                                    className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {savingPreferences
                                        ? "Saving..."
                                        : "Save Preferences"}
                                </button>
                            </div>
                        </>
                    )}
                </section>

                {/* Security Settings */}
                <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Security Settings
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Monitor devices where your DevCollab account is currently
                                signed in.
                            </p>
                        </div>

                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                            {loadingSessions
                                ? "Loading..."
                                : `${sessions.length} active session${sessions.length === 1 ? "" : "s"}`}
                        </span>
                    </div>

                    <div className="mt-7">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-semibold text-slate-100">
                                Active Sessions
                            </h3>

                            <button
                                type="button"
                                onClick={handleRevokeOtherSessions}
                                disabled={
                                    loadingSessions ||
                                    otherSessionsCount === 0 ||
                                    revokingOtherSessions
                                }
                                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {revokingOtherSessions
                                    ? "Revoking..."
                                    : "Revoke all other sessions"}
                            </button>
                        </div>

                        <p className="mt-2 text-sm text-slate-400">
                            If you see a device you don't recognize, you can sign it out.
                            Your current session will not be affected.
                        </p>

                        {sessionError && (
                            <p
                                role="alert"
                                className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
                            >
                                {sessionError}
                            </p>
                        )}

                        {sessionSuccess && (
                            <p
                                role="status"
                                className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400"
                            >
                                {sessionSuccess}
                            </p>
                        )}

                        {loadingSessions ? (
                            <p className="mt-7 text-sm text-slate-400">
                                Loading your active sessions...
                            </p>
                        ) : sessions.length === 0 ? (
                            <p className="mt-7 rounded-xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
                                No active sessions were found.
                            </p>
                        ) : (
                            <div className="mt-6 space-y-4">
                                {sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="rounded-xl border border-slate-800 bg-slate-950/70 p-5"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-lg">
                                                    <span aria-hidden="true">💻</span>
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="font-medium text-slate-100">
                                                        {getDeviceName(session.userAgent)}
                                                    </p>

                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        {session.isCurrent && (
                                                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                                                                Current session
                                                            </span>
                                                        )}

                                                        {!session.isCurrent && (
                                                            <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                                                                Other device
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {!session.isCurrent && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevokeSession(session)}
                                                    disabled={
                                                        revokingSessionId === session.id ||
                                                        revokingOtherSessions
                                                    }
                                                    className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {revokingSessionId === session.id
                                                        ? "Revoking..."
                                                        : "Revoke session"}
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-5 grid gap-4 border-t border-slate-800 pt-4 text-sm sm:grid-cols-2">
                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Signed in
                                                </p>

                                                <p className="mt-1 text-slate-300">
                                                    {formatDate(session.createdAt)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-500">
                                                    Last active
                                                </p>

                                                <p className="mt-1 text-slate-300">
                                                    {formatDate(session.lastActivityAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-7 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                        <p className="font-medium text-amber-300">
                            Keep your account secure
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                            Only keep sessions active on devices you trust. Revoking a
                            session signs that device out of DevCollab.
                        </p>
                    </div>
                </section>
                {/* Danger Zone */}
                <section className="mt-8 rounded-2xl border border-red-500/30 bg-red-950/20 p-6 sm:p-8">
                    <div>
                        <h2 className="text-lg font-semibold text-red-400">
                            Danger Zone
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Permanently delete your DevCollab account and associated personal
                            account data.
                        </p>
                    </div>

                    <div className="mt-6 rounded-xl border border-red-500/20 bg-slate-950/60 p-5">
                        <h3 className="font-semibold text-white">
                            Delete Account
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            This action is permanent. Your personal workspaces will be
                            deleted. Team workspaces you own will be transferred to their
                            earliest-joined remaining member. Your connected GitHub account
                            and active sessions will be removed from DevCollab.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setDeleteConfirmation("");
                                setDeleteError("");
                                setShowDeleteDialog(true);
                            }}
                            className="mt-5 rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                        >
                            Delete My Account
                        </button>
                    </div>
                </section>

                {/* Account Deletion Confirmation */}
                {showDeleteDialog && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                        role="presentation"
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="delete-dialog-title"
                            className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl"
                        >
                            <h2
                                id="delete-dialog-title"
                                className="text-xl font-bold text-red-400"
                            >
                                Permanently Delete Account?
                            </h2>

                            <p className="mt-4 text-sm leading-6 text-slate-300">
                                This action cannot be undone. Your DevCollab account and
                                associated personal data will be permanently deleted.
                            </p>

                            <label
                                htmlFor="delete-confirmation"
                                className="mt-6 block text-sm font-medium text-slate-200"
                            >
                                Type DELETE to confirm
                            </label>

                            <input
                                id="delete-confirmation"
                                type="text"
                                value={deleteConfirmation}
                                onChange={(event) => {
                                    setDeleteConfirmation(event.target.value);
                                    setDeleteError("");
                                }}
                                placeholder="DELETE"
                                autoComplete="off"
                                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            />

                            {deleteError && (
                                <p role="alert" className="mt-3 text-sm text-red-400">
                                    {deleteError}
                                </p>
                            )}

                            <div className="mt-7 flex flex-wrap justify-end gap-3">
                                <button
                                    type="button"
                                    disabled={deletingAccount}
                                    onClick={() => {
                                        setShowDeleteDialog(false);
                                        setDeleteConfirmation("");
                                        setDeleteError("");
                                    }}
                                    className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    disabled={
                                        deleteConfirmation !== "DELETE" || deletingAccount
                                    }
                                    onClick={handleDeleteAccount}
                                    className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {deletingAccount ? "Deleting Account..." : "Permanently Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default AccountSettings;
