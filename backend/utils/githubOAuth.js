
import { createHash, randomBytes } from "node:crypto";
import redis from "../config/redis.js";

const STATE_TTL_SECONDS = 600;

const STATE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const VERIFIER_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const createOAuthRequest = async () => {
    const state = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(32).toString("base64url");

    const codeChallenge = createHash("sha256")
        .update(codeVerifier)
        .digest("base64url");

    const stored = await redis.set(
        `github:oauth:state:${state}`,
        JSON.stringify({ codeVerifier }),
        "EX",
        STATE_TTL_SECONDS,
        "NX"
    );

    if (stored !== "OK") {
        throw new Error("Unable to store OAuth state.");
    }

    return {
        state,
        codeChallenge,
    };
};

export const consumeOAuthState = async (state) => {
    if (
        typeof state !== "string" ||
        !STATE_PATTERN.test(state)
    ) {
        return null;
    }

    const storedData = await redis.getdel(
        `github:oauth:state:${state}`
    );

    if (!storedData) {
        return null;
    }

    try {
        const oauthData = JSON.parse(storedData);

        if (
            !oauthData ||
            typeof oauthData !== "object" ||
            typeof oauthData.codeVerifier !== "string" ||
            !VERIFIER_PATTERN.test(oauthData.codeVerifier)
        ) {
            return null;
        }

        return {
            codeVerifier: oauthData.codeVerifier,
        };
    } catch {
        return null;
    }
};
