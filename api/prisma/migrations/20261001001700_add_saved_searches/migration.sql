-- CreateTable
CREATE TABLE "SavedSearches" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" VARCHAR(32) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nameKey" VARCHAR(100) NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SavedSearches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearches_token_key" ON "SavedSearches"("token");

-- CreateIndex
CREATE UNIQUE INDEX "saved_searches_userId_nameKey_unique_idx" ON "SavedSearches"("userId", "nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "saved_searches_userId_query_unique_idx" ON "SavedSearches"("userId", "query");

-- AddForeignKey
ALTER TABLE "SavedSearches" ADD CONSTRAINT "SavedSearches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
