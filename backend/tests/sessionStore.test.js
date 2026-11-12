
import { beforeEach, describe, expect, it, vi } from "vitest";

const redisMock = vi.hoisted(() => {
    const values = new Map();
    const hashes = new Map();
    const expirations = new Map();

    const getHash = (key) => {
        if (!hashes.has(key)) {
            hashes.set(key, new Map());
        }

        return hashes.get(key);
    };

    const redis = {
        values,
        hashes,
        expirations,

        reset() {
            values.clear();
            hashes.clear();
            expirations.clear();
        },

        async get(key) {
            return values.get(key) ?? null;
        },

        async hgetall(key) {
            return Object.fromEntries(getHash(key));
        },

        async hdel(key, field) {
            return getHash(key).delete(field) ? 1 : 0;
        },

        async del(key) {
            const existed = values.delete(key) || hashes.delete(key);
            expirations.delete(key);
            return existed ? 1 : 0;
        },

        async hset(key, field, value) {
            getHash(key).set(field, value);
            return 1;
        },

        multi() {
            const commands = [];

            const transaction = {
                set(key, value, ...args) {
                    commands.push(() => {
                        redis.values.set(key, value);

                        const exIndex = args.indexOf("EX");

                        if (exIndex !== -1) {
                            redis.expirations.set(
                                key,
                                Number(args[exIndex + 1])
                            );
                        }

                        return "OK";
                    });

                    return transaction;
                },

                hset(key, field, value) {
                    commands.push(() => {
                        getHash(key).set(field, value);
                        return 1;
                    });

                    return transaction;
                },

                hdel(key, field) {
                    commands.push(() => {
                        return getHash(key).delete(field) ? 1 : 0;
                    });

                    return transaction;
                },

                del(key) {
                    commands.push(() => {
                        const existed =
                            redis.values.delete(key) ||
                            redis.hashes.delete(key);

                        redis.expirations.delete(key);

                        return existed ? 1 : 0;
                    });

                    return transaction;
                },

                expire(key, seconds) {
                    commands.push(() => {
                        redis.expirations.set(key, seconds);
                        return 1;
                    });

                    return transaction;
                },

                async exec() {
                    return commands.map((command) => {
                        try {
                            return [null, command()];
                        } catch (error) {
                            return [error, null];
                        }
                    });
                },
            };

            return transaction;
        },
    };

    return redis;
});

vi.mock("../config/redis.js", () => ({
    default: redisMock,
}));

import sessionStore from "../config/sessionStore.js";

const SESSION_PREFIX = "devcollab:session:";
const USER_SESSIONS_PREFIX = "devcollab:user-sessions:";

const saveSession = (sid, sessionData) =>
    new Promise((resolve, reject) => {
        sessionStore.set(sid, sessionData, (error) => {
            if (error) return reject(error);
            resolve();
        });
    });

const getSession = (sid) =>
    new Promise((resolve, reject) => {
        sessionStore.get(sid, (error, data) => {
            if (error) return reject(error);
            resolve(data);
        });
    });

const destroySession = (sid) =>
    new Promise((resolve, reject) => {
        sessionStore.destroy(sid, (error) => {
            if (error) return reject(error);
            resolve();
        });
    });

const createSessionData = (userId, recordId) => ({
    userId,
    sessionRecordId: recordId,
    userAgent: "Test browser",
    createdAt: new Date().toISOString(),
    cookie: {
        maxAge: 86400000,
    },
});

describe("Redis Session Store", () => {
    beforeEach(() => {
        redisMock.reset();
    });

    it("stores and retrieves a session", async () => {
        const sessionData = createSessionData("user-1", "record-1");

        await saveSession("session-1", sessionData);

        const storedSession = await getSession("session-1");

        expect(storedSession).toEqual(sessionData);
    });

    it("sets expiration on the user-session metadata hash", async () => {
        const sessionData = createSessionData("user-1", "record-1");

        await saveSession("session-1", sessionData);

        expect(
            redisMock.expirations.get(
                `${USER_SESSIONS_PREFIX}user-1`
            )
        ).toBe(86400);
    });

    it("removes a session and its metadata when destroyed", async () => {
        await saveSession(
            "session-1",
            createSessionData("user-1", "record-1")
        );

        await destroySession("session-1");

        expect(await getSession("session-1")).toBeNull();

        expect(
            redisMock.hashes
                .get(`${USER_SESSIONS_PREFIX}user-1`)
                ?.has("session-1")
        ).toBe(false);
    });

    it("revokes other sessions without revoking the current session", async () => {
        await saveSession(
            "current-session",
            createSessionData("user-1", "current-record")
        );

        await saveSession(
            "other-session",
            createSessionData("user-1", "other-record")
        );

        const revokedCount =
            await sessionStore.destroyOtherUserSessions(
                "user-1",
                "current-record"
            );

        expect(revokedCount).toBe(1);

        expect(await getSession("current-session")).not.toBeNull();
        expect(await getSession("other-session")).toBeNull();
    });

    it("does not destroy a session belonging to another user", async () => {
        await redisMock.values.set(
            `${SESSION_PREFIX}foreign-session`,
            JSON.stringify(
                createSessionData("user-2", "foreign-record")
            )
        );

        await redisMock.hset(
            `${USER_SESSIONS_PREFIX}user-1`,
            "foreign-session",
            JSON.stringify({
                id: "foreign-record",
                userAgent: "Test browser",
            })
        );

        const revokedCount =
            await sessionStore.destroyOtherUserSessions(
                "user-1",
                "current-record"
            );

        expect(revokedCount).toBe(0);

        expect(
            await getSession("foreign-session")
        ).not.toBeNull();
    });

    it("handles corrupted session metadata without crashing", async () => {
        await redisMock.values.set(
            `${SESSION_PREFIX}session-1`,
            JSON.stringify(
                createSessionData("user-1", "record-1")
            )
        );

        await redisMock.hset(
            `${USER_SESSIONS_PREFIX}user-1`,
            "session-1",
            "invalid-json"
        );

        const revokedCount =
            await sessionStore.destroyOtherUserSessions(
                "user-1",
                "current-record"
            );

        expect(revokedCount).toBe(0);

        expect(
            redisMock.hashes
                .get(`${USER_SESSIONS_PREFIX}user-1`)
                ?.has("session-1")
        ).toBe(false);

        expect(await getSession("session-1")).not.toBeNull();
    });
});
