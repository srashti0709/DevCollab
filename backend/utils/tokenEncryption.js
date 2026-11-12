
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import "dotenv/config";

const encodedKey = process.env.TOKEN_ENCRYPTION_KEY || "";

if (
    !/^[A-Za-z0-9+/]+={0,2}$/.test(encodedKey) ||
    encodedKey.length % 4 !== 0
) {
    throw new Error(
        "TOKEN_ENCRYPTION_KEY must be a valid Base64-encoded 32-byte key."
    );
}

const encryptionKey = Buffer.from(encodedKey, "base64");

if (
    encryptionKey.length !== 32 ||
    encryptionKey.toString("base64") !== encodedKey
) {
    throw new Error(
        "TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes."
    );
}

const decodeBase64 = (value) => {
    if (
        typeof value !== "string" ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(value) ||
        value.length % 4 !== 0
    ) {
        throw new Error("Invalid encrypted token format.");
    }

    const decoded = Buffer.from(value, "base64");

    if (decoded.toString("base64") !== value) {
        throw new Error("Invalid encrypted token format.");
    }

    return decoded;
};

export const encryptToken = (token) => {
    if (typeof token !== "string" || token.length === 0) {
        throw new Error("A valid token is required.");
    }

    const iv = randomBytes(12);

    const cipher = createCipheriv(
        "aes-256-gcm",
        encryptionKey,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(token, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        encrypted.toString("base64"),
    ].join(".");
};

export const decryptToken = (encryptedToken) => {
    if (
        typeof encryptedToken !== "string" ||
        encryptedToken.length === 0
    ) {
        throw new Error("A valid encrypted token is required.");
    }

    const parts = encryptedToken.split(".");

    if (parts.length !== 3) {
        throw new Error("Invalid encrypted token format.");
    }

    const [ivEncoded, authTagEncoded, encryptedEncoded] = parts;

    const iv = decodeBase64(ivEncoded);
    const authTag = decodeBase64(authTagEncoded);
    const encrypted = decodeBase64(encryptedEncoded);

    if (iv.length !== 12 || authTag.length !== 16 || encrypted.length === 0) {
        throw new Error("Invalid encrypted token format.");
    }

    const decipher = createDecipheriv(
        "aes-256-gcm",
        encryptionKey,
        iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
};
