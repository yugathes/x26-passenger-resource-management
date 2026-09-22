import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../lib/http-error';
import { recordAccessAudit } from '../audit/audit.service';
import { canAccessResource } from './authorization.service';
import { AccessResourceInput } from './access.types';

const ACCESS_ACTION = 'RESOURCE_ACCESS_ATTEMPT';

export interface AccessResourceResult {
  allowed: boolean;
  reason?: string;
  usage?: Awaited<ReturnType<typeof prisma.resourceUsage.create>>;
}

export const attemptResourceAccess = async (input: AccessResourceInput): Promise<AccessResourceResult> => {
  const passenger = await prisma.passenger.findUnique({ where: { id: input.passengerId } });
  if (!passenger) {
    throw new NotFoundError(`Passenger ${input.passengerId} not found`);
  }

  const resource = await prisma.resource.findUnique({ where: { id: input.resourceId } });
  if (!resource) {
    throw new NotFoundError(`Resource ${input.resourceId} not found`);
  }

  const decision = canAccessResource(passenger, resource);

  if (!decision.allowed) {
    await recordAccessAudit({
      action: ACCESS_ACTION,
      result: 'DENIED',
      passengerId: passenger.id,
      resourceId: resource.id,
      reason: decision.reason
    });
    return { allowed: false, reason: decision.reason };
  }

  const usage = await prisma.resourceUsage.create({
    data: { passengerId: passenger.id, resourceId: resource.id }
  });

  await recordAccessAudit({
    action: ACCESS_ACTION,
    result: 'ALLOWED',
    passengerId: passenger.id,
    resourceId: resource.id
  });

  return { allowed: true, usage };
};
