
import session from "express-session";
import redis from "./redis.js";

const SESSION_PREFIX = "devcollab:session:";
const USER_SESSIONS_PREFIX = "devcollab:user-sessions:";
const DEFAULT_TTL_SECONDS = 86400;

class RedisSessionStore extends session.Store {
    get(sid, callback) {
        redis
            .get(`${SESSION_PREFIX}${sid}`)
            .then((data) => {
                if (!data) {
                    return callback(null, null);
                }

                callback(null, JSON.parse(data));
            })
            .catch(callback);
    }

    set(sid, sessionData, callback = () => {}) {
        const expiresAt = sessionData.cookie?.expires
            ? new Date(sessionData.cookie.expires).getTime()
            : null;

        const ttl = expiresAt
            ? Math.ceil((expiresAt - Date.now()) / 1000)
            : Math.ceil(
                (sessionData.cookie?.maxAge || DEFAULT_TTL_SECONDS * 1000) /
                1000
            );

        if (ttl <= 0) {
            return this.destroy(sid, callback);
        }

        const sessionKey = `${SESSION_PREFIX}${sid}`;
        const userSessionsKey = sessionData.userId
            ? `${USER_SESSIONS_PREFIX}${sessionData.userId}`
            : null;

        const commands = redis.multi().set(
            sessionKey,
            JSON.stringify(sessionData),
            "EX",
            ttl
        );

        if (userSessionsKey && sessionData.sessionRecordId) {
            const metadata = {
                id: sessionData.sessionRecordId,
                userAgent: sessionData.userAgent || "Unknown device",
                createdAt: sessionData.createdAt,
                lastActivityAt: new Date().toISOString(),
            };

            commands.hset(
                userSessionsKey,
                sid,
                JSON.stringify(metadata)
            );

            // Keep the metadata index from accumulating indefinitely.
            commands.expire(
                userSessionsKey,
                Math.max(ttl, DEFAULT_TTL_SECONDS)
            );
        }

        commands
            .exec()
            .then((results) => {
                const failedCommand = results?.find(([error]) => error);

                if (failedCommand) {
                    return callback(failedCommand[0]);
                }

                callback(null);
            })
            .catch(callback);
    }

    destroy(sid, callback = () => {}) {
        const sessionKey = `${SESSION_PREFIX}${sid}`;

        redis
            .get(sessionKey)
            .then(async (storedData) => {
                const commands = redis.multi().del(sessionKey);

                if (storedData) {
                    try {
                        const sessionData = JSON.parse(storedData);

                        if (sessionData.userId) {
                            commands.hdel(
                                `${USER_SESSIONS_PREFIX}${sessionData.userId}`,
                                sid
                            );
                        }
                    } catch {
                        // Remove the session even if its stored data is invalid.
                    }
                }

                const results = await commands.exec();
                const failedCommand = results?.find(([error]) => error);

                if (failedCommand) {
                    return callback(failedCommand[0]);
                }

                callback(null);
            })
            .catch(callback);
    }

    touch(sid, sessionData, callback = () => {}) {
        this.set(sid, sessionData, callback);
    }

    async getUserSessions(userId) {
        const key = `${USER_SESSIONS_PREFIX}${userId}`;
        const records = await redis.hgetall(key);
        const activeSessions = [];

        for (const [sid, metadataJson] of Object.entries(records)) {
            try {
                const sessionData = await redis.get(
                    `${SESSION_PREFIX}${sid}`
                );

                if (!sessionData) {
                    await redis.hdel(key, sid);
                    continue;
                }

                const parsedSession = JSON.parse(sessionData);

                if (parsedSession.userId !== userId) {
                    await redis.hdel(key, sid);
                    continue;
                }

                activeSessions.push(JSON.parse(metadataJson));
            } catch {
                await redis.hdel(key, sid);
            }
        }

        return activeSessions.sort(
            (a, b) =>
                new Date(b.lastActivityAt) - new Date(a.lastActivityAt)
        );
    }

    async destroyUserSession(userId, sessionRecordId) {
        const key = `${USER_SESSIONS_PREFIX}${userId}`;
        const records = await redis.hgetall(key);

        for (const [sid, metadataJson] of Object.entries(records)) {
            const metadata = JSON.parse(metadataJson);

            if (metadata.id !== sessionRecordId) {
                continue;
            }

            const storedData = await redis.get(
                `${SESSION_PREFIX}${sid}`
            );

            if (!storedData) {
                await redis.hdel(key, sid);
                return false;
            }

            const sessionData = JSON.parse(storedData);

            if (sessionData.userId !== userId) {
                return false;
            }

            await new Promise((resolve, reject) => {
                this.destroy(sid, (error) => {
                    if (error) return reject(error);
                    resolve();
                });
            });

            return true;
        }

        return false;
    }

    async destroyOtherUserSessions(userId, currentRecordId) {
        const key = `${USER_SESSIONS_PREFIX}${userId}`;
        const records = await redis.hgetall(key);
        let revokedCount = 0;

        for (const [sid, metadataJson] of Object.entries(records)) {
            let metadata;

            try {
                metadata = JSON.parse(metadataJson);

                if (
                    !metadata ||
                    typeof metadata !== "object" ||
                    typeof metadata.id !== "string"
                ) {
                    await redis.hdel(key, sid);
                    continue;
                }
            } catch {
                // Remove corrupted metadata without touching a session
                // whose ownership cannot be verified.
                await redis.hdel(key, sid);
                continue;
            }

            if (metadata.id === currentRecordId) {
                continue;
            }

            const storedData = await redis.get(
                `${SESSION_PREFIX}${sid}`
            );

            if (!storedData) {
                await redis.hdel(key, sid);
                continue;
            }

            let sessionData;

            try {
                sessionData = JSON.parse(storedData);
            } catch {
                await redis.hdel(key, sid);
                continue;
            }

            if (
                !sessionData ||
                sessionData.userId !== userId
            ) {
                await redis.hdel(key, sid);
                continue;
            }

            await new Promise((resolve, reject) => {
                this.destroy(sid, (error) => {
                    if (error) return reject(error);
                    resolve();
                });
            });

            revokedCount += 1;
        }

        return revokedCount;
    }

    // Destroy every session belonging to a user, including the current one.
    async destroyAllUserSessions(userId) {
        const key = `${USER_SESSIONS_PREFIX}${userId}`;
        const records = await redis.hgetall(key);

        let revokedCount = 0;

        for (const [sid] of Object.entries(records)) {
            const sessionKey = `${SESSION_PREFIX}${sid}`;
            const storedData = await redis.get(sessionKey);

            if (!storedData) {
                await redis.hdel(key, sid);
                continue;
            }

            let sessionData;

            try {
                sessionData = JSON.parse(storedData);
            } catch {
                await redis.hdel(key, sid);
                continue;
            }

            // Never destroy a session belonging to another user.
            if (sessionData.userId !== userId) {
                await redis.hdel(key, sid);
                continue;
            }

            await new Promise((resolve, reject) => {
                this.destroy(sid, (error) => {
                    if (error) return reject(error);
                    resolve();
                });
            });

            revokedCount += 1;
        }

        await redis.del(key);

        return revokedCount;
    }
}

const sessionStore = new RedisSessionStore();

export default sessionStore;
