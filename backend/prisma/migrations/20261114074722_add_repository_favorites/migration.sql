-- CreateTable
CREATE TABLE "RepositoryFavorite" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoryFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepositoryFavorite_userId_idx" ON "RepositoryFavorite"("userId");

-- CreateIndex
CREATE INDEX "RepositoryFavorite_repositoryId_idx" ON "RepositoryFavorite"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "RepositoryFavorite_userId_repositoryId_key" ON "RepositoryFavorite"("userId", "repositoryId");

-- AddForeignKey
ALTER TABLE "RepositoryFavorite" ADD CONSTRAINT "RepositoryFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepositoryFavorite" ADD CONSTRAINT "RepositoryFavorite_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;
