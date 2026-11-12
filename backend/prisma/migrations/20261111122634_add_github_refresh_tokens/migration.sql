-- AlterTable
ALTER TABLE "GitHubAccount" ADD COLUMN     "refreshTokenEncrypted" TEXT,
ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3);
