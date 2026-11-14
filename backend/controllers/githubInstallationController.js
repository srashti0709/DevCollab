
import prisma from "../config/prisma.js";
import { createInstallationState, consumeInstallationState } from "../utils/githubInstallation.js";
import { githubAppOctokit } from "../config/githubApp.js";

export const startGitHubInstallation = async (req, res) => {
    try {
        const state = await createInstallationState(req.userId);

        const { data } = await githubAppOctokit.request("GET /app");

        const installationUrl =
            `https://github.com/apps/${data.slug}/installations/new?state=${encodeURIComponent(state)}`;

        return res.status(200).json({
            success: true,
            installationUrl,
        });
    } catch (error) {
        console.error("GitHub installation start failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to start GitHub App installation.",
        });
    }
};

export const handleGitHubInstallationCallback = async (req, res) => {
    try {
        const { installation_id, setup_action, state } = req.query;

        if (
            typeof installation_id !== "string" ||
            !/^\d+$/.test(installation_id) ||
            !Number.isSafeInteger(Number(installation_id)) ||
            !["install", "update"].includes(setup_action)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid GitHub installation callback.",
            });
        }

        const installationState = await consumeInstallationState(state);

        if (!installationState) {
            return res.status(400).json({
                success: false,
                message: "Installation request expired or is invalid. Please try again.",
            });
        }

        const { data } = await githubAppOctokit.request(
            "GET /app/installations/{installation_id}",
            {
                installation_id: Number(installation_id),
            }
        );

        if (!data.account?.login || !data.account?.type) {
            throw new Error("GitHub returned incomplete installation details.");
        }

        await prisma.$transaction(async (transaction) => {
            const installation = await transaction.gitHubAppInstallation.upsert({
                where: {
                    githubInstallationId: BigInt(data.id),
                },
                update: {
                    accountLogin: data.account.login,
                    accountType: data.account.type,
                },
                create: {
                    githubInstallationId: BigInt(data.id),
                    accountLogin: data.account.login,
                    accountType: data.account.type,
                },
            });

            await transaction.gitHubInstallationConnection.upsert({
                where: {
                    userId_installationId: {
                        userId: installationState.userId,
                        installationId: installation.id,
                    },
                },
                update: {},
                create: {
                    userId: installationState.userId,
                    installationId: installation.id,
                },
            });
        });

        return res.status(200).json({
            success: true,
            message: "GitHub App installation connected successfully.",
            account: data.account.login,
        });
    } catch (error) {
        console.error("GitHub installation callback failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to complete GitHub installation.",
        });
    }
};
