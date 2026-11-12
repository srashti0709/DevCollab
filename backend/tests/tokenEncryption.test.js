
import { describe, it, expect } from "vitest";
import {
    encryptToken,
    decryptToken,
} from "../utils/tokenEncryption.js";

describe("Token Encryption", () => {
    it("encrypts and decrypts a token correctly", () => {
        const originalToken = "test-github-access-token";

        const encryptedToken = encryptToken(originalToken);
        const decryptedToken = decryptToken(encryptedToken);

        expect(encryptedToken).not.toBe(originalToken);
        expect(decryptedToken).toBe(originalToken);
    });

    it("generates different encrypted values for the same token", () => {
        const token = "test-github-access-token";

        const firstEncryption = encryptToken(token);
        const secondEncryption = encryptToken(token);

        expect(firstEncryption).not.toBe(secondEncryption);
        expect(decryptToken(firstEncryption)).toBe(token);
        expect(decryptToken(secondEncryption)).toBe(token);
    });

    it("rejects an empty token", () => {
        expect(() => encryptToken("")).toThrow();
    });

    it("rejects a non-string token", () => {
        expect(() => encryptToken(12345)).toThrow();
    });

    it("rejects an invalid encrypted token format", () => {
        expect(() => decryptToken("invalid-token")).toThrow();
    });

    it("rejects an encrypted token with missing segments", () => {
        expect(() => decryptToken("abc.def")).toThrow();
    });

    it("rejects a modified authentication tag", () => {
        const encrypted = encryptToken("test-github-access-token");
        const parts = encrypted.split(".");

        parts[1] = Buffer.from(
            "1234567890123456"
        ).toString("base64");

        expect(() => decryptToken(parts.join("." ) )).toThrow();
    });
});
