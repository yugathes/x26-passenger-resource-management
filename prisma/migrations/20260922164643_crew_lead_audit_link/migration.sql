-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "crewLeadId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_crewLeadId_idx" ON "AuditLog"("crewLeadId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_crewLeadId_fkey" FOREIGN KEY ("crewLeadId") REFERENCES "CrewLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
