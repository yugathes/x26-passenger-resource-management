/*
  Warnings:

  - You are about to drop the column `passengerId` on the `Resource` table. All the data in the column will be lost.
  - The `status` column on the `Resource` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MembershipLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_passengerId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_passengerId_fkey";

-- AlterTable
ALTER TABLE "Passenger" ADD COLUMN     "crewLeadId" TEXT,
ADD COLUMN     "level" "MembershipLevel" NOT NULL DEFAULT 'BRONZE';

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "passengerId",
DROP COLUMN "status",
ADD COLUMN     "status" "ResourceStatus" NOT NULL DEFAULT 'AVAILABLE';

-- DropTable
DROP TABLE "Booking";

-- CreateTable
CREATE TABLE "CrewLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "level" "MembershipLevel" NOT NULL DEFAULT 'BRONZE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceUsage" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "purpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "performedBy" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrewLead_email_key" ON "CrewLead"("email");

-- CreateIndex
CREATE INDEX "ResourceUsage_passengerId_idx" ON "ResourceUsage"("passengerId");

-- CreateIndex
CREATE INDEX "ResourceUsage_resourceId_idx" ON "ResourceUsage"("resourceId");

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_crewLeadId_fkey" FOREIGN KEY ("crewLeadId") REFERENCES "CrewLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUsage" ADD CONSTRAINT "ResourceUsage_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceUsage" ADD CONSTRAINT "ResourceUsage_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_crewLead_fkey" FOREIGN KEY ("performedBy") REFERENCES "CrewLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_passenger_fkey" FOREIGN KEY ("performedBy") REFERENCES "Passenger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_resource_fkey" FOREIGN KEY ("performedBy") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
