-- CreateEnum
CREATE TYPE "public"."enum_Users_role" AS ENUM ('agent', 'moderator', 'client');

-- AlterTable
ALTER TABLE "public"."Users" ALTER COLUMN "phone" SET NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."enum_Users_role" NOT NULL DEFAULT 'client';

-- AlterTable
ALTER TABLE "public"."Viewings" ADD COLUMN     "clientId" INTEGER,
ADD COLUMN     "reminderSentAt" TIMESTAMPTZ(6);

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateTable
CREATE TABLE "public"."ListingStatusHistory" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "agentId" INTEGER NOT NULL,
    "fromStatus" "public"."ListingStatus" NOT NULL,
    "toStatus" "public"."ListingStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ListingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingStatusHistory_agentId_createdAt_idx" ON "public"."ListingStatusHistory"("agentId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "ListingStatusHistory_listingId_createdAt_idx" ON "public"."ListingStatusHistory"("listingId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."Users"("role" ASC);

-- CreateIndex
CREATE INDEX "viewings_clientId_idx" ON "public"."Viewings"("clientId" ASC);

-- AddForeignKey
ALTER TABLE "public"."ListingStatusHistory" ADD CONSTRAINT "ListingStatusHistory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "public"."Listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Viewings" ADD CONSTRAINT "Viewings_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

