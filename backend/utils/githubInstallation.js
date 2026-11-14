import { randomBytes } from "node:crypto";
import redis from "../config/redis.js";

const STATE_TTL_SECONDS = 600;
const STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const createInstallationState = async (userId) => {
    if (typeof userId !== "string" || !userId.trim()) {
        throw new Error("A valid authenticated user ID is required.");
    }

    const state = randomBytes(32).toString("base64url");

    const stored = await redis.set(
        `github:installation:state:${state}`,
        JSON.stringify({ userId }),
        "EX",
        STATE_TTL_SECONDS,
        "NX"
    );

    if (stored !== "OK") {
        throw new Error("Unable to store GitHub installation state.");
    }

    return state;
};

export const consumeInstallationState = async (state) => {
    if (
        typeof state !== "string" ||
        !STATE_PATTERN.test(state)
    ) {
        return null;
    }

    const storedData = await redis.getdel(
        `github:installation:state:${state}`
    );

    if (!storedData) {
        return null;
    }

    try {
        const installationData = JSON.parse(storedData);

        if (
            !installationData ||
            typeof installationData.userId !== "string" ||
            !installationData.userId.trim()
        ) {
            return null;
        }

        return {
            userId: installationData.userId,
        };
    } catch {
        return null;
    }
};
