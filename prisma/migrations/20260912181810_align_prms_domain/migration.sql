-- Add the resource access decision enum.
CREATE TYPE "AccessDecision" AS ENUM ('ALLOWED', 'DENIED');

-- Align passenger membership with the finalized domain name.
ALTER TABLE "Passenger" RENAME COLUMN "level" TO "membership";
ALTER TABLE "Passenger" ALTER COLUMN "membership" SET DEFAULT 'BRONZE';

-- Crew leads have an explicit role in the PRMS domain.
ALTER TABLE "CrewLead" DROP COLUMN "level";
ALTER TABLE "CrewLead" DROP COLUMN "phone";
ALTER TABLE "CrewLead" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'crew_lead';
ALTER TABLE "CrewLead" ALTER COLUMN "role" DROP DEFAULT;

-- Resources keep their current passenger assignment and use the enum status.
ALTER TABLE "Resource" ADD COLUMN "passengerId" TEXT;

-- Normalize usage interval names.
ALTER TABLE "ResourceUsage" RENAME COLUMN "startTime" TO "usageStart";
ALTER TABLE "ResourceUsage" RENAME COLUMN "endTime" TO "usageEnd";
ALTER TABLE "ResourceUsage" DROP COLUMN "purpose";
ALTER TABLE "ResourceUsage" ALTER COLUMN "usageStart" SET DEFAULT CURRENT_TIMESTAMP;

-- Keep audit records focused on domain entities and crew-lead actors.
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_crewLead_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_passenger_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_resource_fkey";
ALTER TABLE "AuditLog" DROP COLUMN "entityType";
ALTER TABLE "AuditLog" DROP COLUMN "performedBy";
ALTER TABLE "AuditLog" DROP COLUMN "details";
ALTER TABLE "AuditLog" ADD COLUMN "entity" TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE "AuditLog" ADD COLUMN "crewLeadId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "metadata" JSONB;
ALTER TABLE "AuditLog" ALTER COLUMN "entity" DROP DEFAULT;

-- Membership-based access rules are the foundation for Day 2 authorization.
CREATE TABLE "ResourceAccess" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "membershipLevel" "MembershipLevel" NOT NULL,
    "decision" "AccessDecision" NOT NULL DEFAULT 'ALLOWED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResourceAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ResourceAccess_resourceId_membershipLevel_key"
  ON "ResourceAccess"("resourceId", "membershipLevel");
CREATE INDEX "ResourceAccess_membershipLevel_idx"
  ON "ResourceAccess"("membershipLevel");
CREATE INDEX "AuditLog_entity_entityId_idx"
  ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_crewLeadId_idx"
  ON "AuditLog"("crewLeadId");

ALTER TABLE "Resource" ADD CONSTRAINT "Resource_passengerId_fkey"
  FOREIGN KEY ("passengerId") REFERENCES "Passenger"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ResourceAccess" ADD CONSTRAINT "ResourceAccess_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_crewLeadId_fkey"
  FOREIGN KEY ("crewLeadId") REFERENCES "CrewLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
