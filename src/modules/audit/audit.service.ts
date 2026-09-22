import { Prisma, ResourceAccessResult } from '@prisma/client';
import { prisma } from '../../db/prisma';

interface RecordAccessAuditInput {
  action: string;
  result: ResourceAccessResult;
  passengerId: string | null;
  resourceId: string | null;
  reason?: string;
  metadata?: Prisma.InputJsonValue;
}

export const recordAccessAudit = async (input: RecordAccessAuditInput) => {
  return prisma.auditLog.create({
    data: {
      action: input.action,
      result: input.result,
      passengerId: input.passengerId,
      resourceId: input.resourceId,
      reason: input.reason,
      metadata: input.metadata
    }
  });
};

interface RecordAdminActionInput {
  action: string;
  crewLeadId: string;
  passengerId?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}

// Crew-lead admin actions are recorded as ALLOWED audit entries so the trail reflects a completed, authorized change
export const recordAdminAction = async (input: RecordAdminActionInput) => {
  return prisma.auditLog.create({
    data: {
      action: input.action,
      result: ResourceAccessResult.ALLOWED,
      crewLeadId: input.crewLeadId,
      passengerId: input.passengerId,
      resourceId: input.resourceId,
      metadata: input.metadata
    }
  });
};
