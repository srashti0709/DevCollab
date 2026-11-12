
import { randomUUID } from "node:crypto";
import githubConfig from "../config/github.js";
import prisma from "../config/prisma.js";
import sessionStore from "../config/sessionStore.js";
import {
    createOAuthRequest,
    consumeOAuthState,
} from "../utils/githubOAuth.js";

import {
    encryptToken,
    decryptToken,
} from "../utils/tokenEncryption.js";

// Validate GitHub token expiry values and convert them into Date objects.
const calculateTokenExpiry = (seconds, tokenType) => {
    if (
        !Number.isSafeInteger(seconds) ||
        seconds <= 0
    ) {
        throw new Error(
            `GitHub returned an invalid ${tokenType} expiration.`
        );
    }

    const expiryTimestamp = Date.now() + seconds * 1000;

    if (
        !Number.isSafeInteger(expiryTimestamp) ||
        expiryTimestamp > 8640000000000000
    ) {
        throw new Error(
            `GitHub returned an invalid ${tokenType} expiration.`
        );
    }

    const expiry = new Date(expiryTimestamp);

    if (Number.isNaN(expiry.getTime())) {
        throw new Error(
            `GitHub returned an invalid ${tokenType} expiration.`
        );
    }

    return expiry;
};

export const startGithubOAuth = async (req, res) => {
    try {
        const { state, codeChallenge } = await createOAuthRequest();

        const authorizationUrl = new URL(
            githubConfig.authorizationUrl
        );

        authorizationUrl.searchParams.set(
            "client_id",
            githubConfig.clientId
        );

        authorizationUrl.searchParams.set(
            "redirect_uri",
            githubConfig.callbackUrl
        );

        authorizationUrl.searchParams.set(
            "scope",
            githubConfig.scopes.join(" ")
        );

        authorizationUrl.searchParams.set("state", state);

        authorizationUrl.searchParams.set(
            "code_challenge",
            codeChallenge
        );

        authorizationUrl.searchParams.set(
            "code_challenge_method",
            "S256"
        );

        return res.redirect(302, authorizationUrl.toString());
    } catch (error) {
        console.error(
            "GitHub OAuth initiation failed:",
            error.message
        );

        return res.status(503).json({
            success: false,
            message: "Unable to start GitHub authentication. Please try again.",
        });
    }
};

// Revoke the DevCollab OAuth application's authorization on GitHub.
const revokeGithubAuthorization = async (accessToken) => {
    if (!accessToken) {
        throw new Error("GitHub access token is unavailable for revocation.");
    }

    const credentials = Buffer.from(
        `${githubConfig.clientId}:${githubConfig.clientSecret}`
    ).toString("base64");

    const response = await fetch(
        `${githubConfig.apiUrl}/applications/${encodeURIComponent(
            githubConfig.clientId
        )}/grant`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Basic ${credentials}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2026-03-10",
            },
            body: JSON.stringify({
                access_token: accessToken,
            }),
            signal: AbortSignal.timeout(15000),
        }
    );

    if (!response.ok) {
        throw new Error(
            `GitHub authorization revocation failed with status ${response.status}.`
        );
    }
};

// Destroy an Express session using its callback-based API.
const destroyExpressSession = (req) => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            return resolve();
        }

        req.session.destroy((error) => {
            if (error) {
                return reject(error);
            }

            resolve();
        });
    });
};

export const handleGithubCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        // Validate and consume the one-time OAuth state.
        const oauthData = await consumeOAuthState(state);

        if (!oauthData) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OAuth state. Please try again.",
            });
        }

        if (error) {
            return res.status(400).json({
                success: false,
                message: "GitHub authorization was not completed.",
            });
        }

        if (!code || typeof code !== "string") {
            return res.status(400).json({
                success: false,
                message: "GitHub authorization code is missing.",
            });
        }

        // Exchange authorization code for GitHub tokens.
        const tokenResponse = await fetch(githubConfig.tokenUrl, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: githubConfig.clientId,
                client_secret: githubConfig.clientSecret,
                code,
                redirect_uri: githubConfig.callbackUrl,
                code_verifier: oauthData.codeVerifier,
            }),
            signal: AbortSignal.timeout(15000),
        });

        let tokenData;

        try {
            tokenData = await tokenResponse.json();
        } catch {
            console.error(
                "GitHub token exchange returned an invalid response."
            );

            return res.status(502).json({
                success: false,
                message: "Unable to complete GitHub authentication.",
            });
        }

        if (
            !tokenResponse.ok ||
            !tokenData ||
            typeof tokenData !== "object" ||
            Array.isArray(tokenData) ||
            tokenData.error ||
            typeof tokenData.access_token !== "string" ||
            !tokenData.access_token.trim()
        ) {
            console.error("GitHub token exchange failed.");

            return res.status(502).json({
                success: false,
                message: "Unable to complete GitHub authentication.",
            });
        }

        // Validate the expiring OAuth token response.
        if (
            typeof tokenData.token_type !== "string" ||
            tokenData.token_type.toLowerCase() !== "bearer"
        ) {
            console.error("GitHub returned an invalid token type.");

            return res.status(502).json({
                success: false,
                message: "GitHub returned an invalid authentication response.",
            });
        }

        if (
            typeof tokenData.refresh_token !== "string" ||
            !tokenData.refresh_token.trim()
        ) {
            console.error("GitHub did not return a valid refresh token.");

            return res.status(502).json({
                success: false,
                message: "GitHub did not return the required refresh token.",
            });
        }

        let accessTokenExpiry;
        let refreshTokenExpiry;

        try {
            accessTokenExpiry = calculateTokenExpiry(
                tokenData.expires_in,
                "access token"
            );

            refreshTokenExpiry = calculateTokenExpiry(
                tokenData.refresh_token_expires_in,
                "refresh token"
            );
        } catch (expiryError) {
            console.error(
                "GitHub token expiry validation failed:",
                expiryError.message
            );

            return res.status(502).json({
                success: false,
                message: "GitHub returned invalid token expiration information.",
            });
        }

        // Retrieve authenticated GitHub profile.
        const profileResponse = await fetch(
            `${githubConfig.apiUrl}/user`,
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                signal: AbortSignal.timeout(15000),
            }
        );

        if (!profileResponse.ok) {
            console.error("GitHub profile retrieval failed.");

            return res.status(502).json({
                success: false,
                message: "Unable to retrieve your GitHub profile.",
            });
        }

        let githubProfile;

        try {
            githubProfile = await profileResponse.json();
        } catch {
            return res.status(502).json({
                success: false,
                message: "GitHub returned an invalid user profile.",
            });
        }

        if (
            !githubProfile ||
            typeof githubProfile !== "object" ||
            Array.isArray(githubProfile) ||
            !Number.isSafeInteger(githubProfile.id) ||
            githubProfile.id <= 0 ||
            typeof githubProfile.login !== "string" ||
            !githubProfile.login.trim()
        ) {
            return res.status(502).json({
                success: false,
                message: "GitHub returned an invalid user profile.",
            });
        }

        // Encrypt tokens before storing them.
        const encryptedAccessToken = encryptToken(
            tokenData.access_token
        );

        const encryptedRefreshToken = encryptToken(
            tokenData.refresh_token
        );

        const githubUserId = BigInt(githubProfile.id);

        const userName = githubProfile.name || githubProfile.login;
        const avatarUrl = githubProfile.avatar_url || null;

        // Prepare account update data.
        const updateData = {
            githubUsername: githubProfile.login,
            accessTokenEncrypted: encryptedAccessToken,
            tokenExpiresAt: accessTokenExpiry,
            refreshTokenEncrypted: encryptedRefreshToken,
            refreshTokenExpiresAt: refreshTokenExpiry,
            user: {
                update: {
                    name: userName,
                    avatarUrl,
                },
            },
        };

        // Create or update the GitHub account.
        const githubAccount = await prisma.gitHubAccount.upsert({
            where: {
                githubUserId,
            },

            update: updateData,

            create: {
                githubUserId,
                githubUsername: githubProfile.login,
                accessTokenEncrypted: encryptedAccessToken,
                tokenExpiresAt: accessTokenExpiry,
                refreshTokenEncrypted: encryptedRefreshToken,
                refreshTokenExpiresAt: refreshTokenExpiry,

                user: {
                    create: {
                        name: userName,
                        avatarUrl,
                    },
                },
            },

            include: {
                user: true,
            },
        });

        // Regenerate and save the authenticated session.
        try {
            // Prevent session fixation by generating a new session ID.
            await new Promise((resolve, reject) => {
                req.session.regenerate((err) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
            });

            // Store only the internal DevCollab user ID in the session.
            req.session.userId = githubAccount.user.id;
            req.session.authenticatedAt = new Date().toISOString();

            // Session management metadata.
            req.session.sessionRecordId = randomUUID();
            req.session.createdAt = new Date().toISOString();
            req.session.userAgent =
                req.get("user-agent") || "Unknown device";

            // Save the session to Redis before responding.
            await new Promise((resolve, reject) => {
                req.session.save((err) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve();
                });
            });
        } catch (sessionError) {
            console.error(
                "OAuth session creation failed:",
                sessionError.message
            );

            // Attempt to remove any partially created session.
            try {
                await destroyExpressSession(req);
            } catch (cleanupError) {
                console.error(
                    "OAuth session cleanup failed:",
                    cleanupError.message
                );
            }

            res.clearCookie("devcollab.sid", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
            });

            return res.status(503).json({
                success: false,
                message: "Authentication could not be completed. Please try logging in again.",
            });
        }

        return res.redirect(
            302,
            `${githubConfig.frontendUrl}/dashboard`
        );
    } catch (error) {
        console.error(
            "GitHub OAuth callback failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "GitHub authentication failed. Please try again.",
        });
    }
};

// Get the currently authenticated DevCollab user.
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.session?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
                displayName: true,
                email: true,
                avatarUrl: true,
                platformRole: true,
                createdAt: true,
                githubAccounts: {
                    select: {
                        githubUsername: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found. Please log in again.",
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                displayName: user.displayName || user.name,
                githubName: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                platformRole: user.platformRole,
                githubAccounts: user.githubAccounts,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error(
            "Fetching current user failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve your account information.",
        });
    }
};

// Log out the currently authenticated user.
export const logout = async (req, res) => {
    try {
        if (!req.session) {
            return res.status(200).json({
                success: true,
                message: "Already logged out.",
            });
        }

        req.session.destroy((error) => {
            if (error) {
                console.error(
                    "Session destruction failed:",
                    error.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Unable to log out. Please try again.",
                });
            }

            res.clearCookie("devcollab.sid", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
            });

            return res.status(200).json({
                success: true,
                message: "Logged out successfully.",
            });
        });
    } catch (error) {
        console.error("Logout failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to log out. Please try again.",
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.session?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        // Accept only the displayName field.
        const allowedFields = ["displayName"];
        const receivedFields = Object.keys(req.body || {});

        const hasInvalidFields = receivedFields.some(
            (field) => !allowedFields.includes(field)
        );

        if (hasInvalidFields || receivedFields.length !== 1) {
            return res.status(400).json({
                success: false,
                message: "Only the displayName field can be updated.",
            });
        }

        if (typeof req.body.displayName !== "string") {
            return res.status(400).json({
                success: false,
                message: "Display name must be a string.",
            });
        }

        const displayName = req.body.displayName.trim();

        if (displayName.length < 2 || displayName.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Display name must be between 2 and 50 characters.",
            });
        }

        const user = await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                displayName,
            },
            select: {
                id: true,
                name: true,
                displayName: true,
                email: true,
                avatarUrl: true,
                platformRole: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: user.id,
                displayName: user.displayName || user.name,
                githubName: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
                platformRole: user.platformRole,
            },
        });
    } catch (error) {
        console.error("Profile update failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to update your profile. Please try again.",
        });
    }
};

// Get the current user's notification preferences.
export const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.session?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        const preferences = await prisma.notificationPreference.upsert({
            where: {
                userId,
            },
            update: {},
            create: {
                userId,
            },
            select: {
                pullRequestUpdates: true,
                issueUpdates: true,
                repositoryActivity: true,
                workspaceInvitations: true,
                updatedAt: true,
            },
        });

        return res.status(200).json({
            success: true,
            preferences: {
                ...preferences,
                securityAlerts: true,
            },
        });
    } catch (error) {
        console.error(
            "Fetching notification preferences failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve notification preferences.",
        });
    }
};

// Update the current user's notification preferences.
export const updateNotificationPreferences = async (req, res) => {
    try {
        const userId = req.session?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        const allowedFields = [
            "pullRequestUpdates",
            "issueUpdates",
            "repositoryActivity",
            "workspaceInvitations",
        ];

        const receivedFields = Object.keys(req.body || {});

        if (
            receivedFields.length === 0 ||
            receivedFields.some((field) => !allowedFields.includes(field))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification preference fields.",
            });
        }

        const hasInvalidValues = receivedFields.some(
            (field) => typeof req.body[field] !== "boolean"
        );

        if (hasInvalidValues) {
            return res.status(400).json({
                success: false,
                message: "Notification preferences must be boolean values.",
            });
        }

        const preferences = await prisma.notificationPreference.upsert({
            where: {
                userId,
            },
            update: req.body,
            create: {
                userId,
                ...req.body,
            },
            select: {
                pullRequestUpdates: true,
                issueUpdates: true,
                repositoryActivity: true,
                workspaceInvitations: true,
                updatedAt: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Notification preferences updated successfully.",
            preferences: {
                ...preferences,
                securityAlerts: true,
            },
        });
    } catch (error) {
        console.error(
            "Updating notification preferences failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update notification preferences.",
        });
    }
};

// Get all active sessions belonging to the current user.
export const getActiveSessions = async (req, res) => {
    try {
        const userId = req.session?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        const currentRecordId = req.session.sessionRecordId;

        const sessions = await sessionStore.getUserSessions(userId);

        return res.status(200).json({
            success: true,
            sessions: sessions.map((session) => ({
                ...session,
                isCurrent: session.id === currentRecordId,
            })),
        });
    } catch (error) {
        console.error("Fetching active sessions failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve active sessions.",
        });
    }
};

// Revoke one selected session.
export const revokeSession = async (req, res) => {
    try {
        const userId = req.session?.userId;
        const currentRecordId = req.session?.sessionRecordId;
        const { sessionId } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        if (!sessionId || typeof sessionId !== "string") {
            return res.status(400).json({
                success: false,
                message: "A valid session ID is required.",
            });
        }

        if (sessionId === currentRecordId) {
            return res.status(400).json({
                success: false,
                message: "You cannot revoke your current session here.",
            });
        }

        const revoked = await sessionStore.destroyUserSession(
            userId,
            sessionId
        );

        if (!revoked) {
            return res.status(404).json({
                success: false,
                message: "Session not found or already expired.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Session revoked successfully.",
        });
    } catch (error) {
        console.error("Session revocation failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to revoke this session.",
        });
    }
};

// Revoke every other session while preserving the current session.
export const revokeOtherSessions = async (req, res) => {
    try {
        const userId = req.session?.userId;
        const currentRecordId = req.session?.sessionRecordId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        if (!currentRecordId) {
            return res.status(400).json({
                success: false,
                message: "Current session could not be identified.",
            });
        }

        const revokedCount = await sessionStore.destroyOtherUserSessions(
            userId,
            currentRecordId
        );

        return res.status(200).json({
            success: true,
            message: "Other sessions revoked successfully.",
            revokedCount,
        });
    } catch (error) {
        console.error("Revoking other sessions failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to revoke other sessions.",
        });
    }
};

export const deleteAccount = async (req, res) => {
    let sessionsRevoked = false;
    let githubRevocationCompleted = false;

    try {
        const userId = req.session?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please log in.",
            });
        }

        if (req.body?.confirmation !== "DELETE") {
            return res.status(400).json({
                success: false,
                message: 'Please enter "DELETE" to confirm account deletion.',
            });
        }

        // Retrieve all GitHub accounts connected to this DevCollab user.
        const githubAccounts = await prisma.gitHubAccount.findMany({
            where: {
                userId,
            },
            select: {
                accessTokenEncrypted: true,
            },
        });

        // Revoke each GitHub OAuth authorization before deleting account data.
        for (const account of githubAccounts) {
            if (!account.accessTokenEncrypted) {
                throw new Error(
                    "Cannot revoke GitHub authorization because an access token is unavailable."
                );
            }

            const accessToken = decryptToken(
                account.accessTokenEncrypted
            );

            await revokeGithubAuthorization(accessToken);
        }

        githubRevocationCompleted = true;

        // Revoke every session before deleting the account.
        await sessionStore.destroyAllUserSessions(userId);
        sessionsRevoked = true;

        // Destroy the current Express session to prevent it from being saved again.
        await destroyExpressSession(req);

        // Transfer ownership and remove account data transactionally.
        await prisma.$transaction(async (tx) => {
            const ownedWorkspaces = await tx.workspace.findMany({
                where: {
                    createdBy: userId,
                },
                select: {
                    id: true,
                    type: true,
                    members: {
                        where: {
                            userId: {
                                not: userId,
                            },
                        },
                        orderBy: {
                            joinedAt: "asc",
                        },
                        take: 1,
                        select: {
                            userId: true,
                        },
                    },
                },
            });

            for (const workspace of ownedWorkspaces) {
                const nextOwner = workspace.members[0];

                // Delete personal workspaces.
                if (workspace.type === "PERSONAL") {
                    await tx.workspace.delete({
                        where: {
                            id: workspace.id,
                        },
                    });

                    continue;
                }

                // Delete team workspaces that have no remaining members.
                if (!nextOwner) {
                    await tx.workspace.delete({
                        where: {
                            id: workspace.id,
                        },
                    });

                    continue;
                }

                // Promote the earliest-joined remaining member.
                await tx.workspaceMember.update({
                    where: {
                        workspaceId_userId: {
                            workspaceId: workspace.id,
                            userId: nextOwner.userId,
                        },
                    },
                    data: {
                        role: "OWNER",
                    },
                });

                // Transfer workspace ownership.
                await tx.workspace.update({
                    where: {
                        id: workspace.id,
                    },
                    data: {
                        createdBy: nextOwner.userId,
                    },
                });
            }

            // Preserve repository connections in surviving workspaces.
            // Reassign the original connector to the workspace creator.
            const connections = await tx.workspaceRepository.findMany({
                where: {
                    connectedBy: userId,
                },
                select: {
                    id: true,
                    workspace: {
                        select: {
                            createdBy: true,
                        },
                    },
                },
            });

            for (const connection of connections) {
                if (connection.workspace.createdBy === userId) {
                    throw new Error(
                        "A repository connection still references the account being deleted."
                    );
                }

                await tx.workspaceRepository.update({
                    where: {
                        id: connection.id,
                    },
                    data: {
                        connectedBy: connection.workspace.createdBy,
                    },
                });
            }

            // Remove invitations sent by this account.
            await tx.workspaceInvitation.deleteMany({
                where: {
                    invitedBy: userId,
                },
            });

            // Delete the user and related records configured with Cascade.
            await tx.user.delete({
                where: {
                    id: userId,
                },
            });
        });

        res.clearCookie("devcollab.sid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        return res.status(200).json({
            success: true,
            message: "Your DevCollab account has been permanently deleted.",
        });
    } catch (error) {
        console.error("Account deletion failed:", error.message);

        if (sessionsRevoked) {
            res.clearCookie("devcollab.sid", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
            });
        }

        return res.status(500).json({
            success: false,
            message: !githubRevocationCompleted
                ? "Unable to revoke your GitHub authorization. Your account has not been deleted."
                : sessionsRevoked
                    ? "Account deletion could not be completed. Your sessions have been signed out. Please log in again."
                    : "Unable to securely revoke your sessions. Your account has not been deleted.",
        });
    }
};
