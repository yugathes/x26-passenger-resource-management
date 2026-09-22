-- CreateIndex
CREATE INDEX "AuditLog_action_resourceId_idx" ON "AuditLog"("action", "resourceId");

-- CreateIndex
CREATE INDEX "Passenger_membership_idx" ON "Passenger"("membership");

-- CreateIndex
CREATE INDEX "Resource_status_idx" ON "Resource"("status");
