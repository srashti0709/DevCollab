-- CreateTable
CREATE TABLE "SavedIssue" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "githubIssueId" BIGINT NOT NULL,
    "issueNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "state" "IssueState" NOT NULL,
    "htmlUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedIssue_userId_idx" ON "SavedIssue"("userId");

-- CreateIndex
CREATE INDEX "SavedIssue_repositoryId_idx" ON "SavedIssue"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedIssue_userId_repositoryId_issueNumber_key" ON "SavedIssue"("userId", "repositoryId", "issueNumber");

-- AddForeignKey
ALTER TABLE "SavedIssue" ADD CONSTRAINT "SavedIssue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedIssue" ADD CONSTRAINT "SavedIssue_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
