import { MembershipLevel } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { getPassengerById } from '../passengers/passenger.service';

export const getPassengerUsageHistory = async (passengerId: string) => {
  await getPassengerById(passengerId);
  return prisma.resourceUsage.findMany({
    where: { passengerId },
    include: { resource: true },
    orderBy: { accessedAt: 'desc' }
  });
};

export const getResourceUsageTotals = async () => {
  const usageCounts = await prisma.resourceUsage.groupBy({
    by: ['resourceId'],
    _count: { _all: true }
  });

  const resources = await prisma.resource.findMany({
    where: { id: { in: usageCounts.map((usage) => usage.resourceId) } }
  });

  return usageCounts
    .map((usage) => ({
      resourceId: usage.resourceId,
      resourceName: resources.find((resource) => resource.id === usage.resourceId)?.name ?? 'Unknown',
      totalUsage: usage._count._all
    }))
    .sort((a, b) => b.totalUsage - a.totalUsage);
};

const ACCESS_ACTION = 'RESOURCE_ACCESS_ATTEMPT';

export const getResourceDemandSummary = async () => {
  const attemptCounts = await prisma.auditLog.groupBy({
    by: ['resourceId', 'result'],
    where: { action: ACCESS_ACTION, resourceId: { not: null } },
    _count: { _all: true }
  });

  const resourceIds = [...new Set(attemptCounts.map((attempt) => attempt.resourceId as string))];
  const resources = await prisma.resource.findMany({ where: { id: { in: resourceIds } } });

  const summary = new Map<string, { resourceId: string; resourceName: string; allowed: number; denied: number }>();
  for (const attempt of attemptCounts) {
    const resourceId = attempt.resourceId as string;
    const entry = summary.get(resourceId) ?? {
      resourceId,
      resourceName: resources.find((resource) => resource.id === resourceId)?.name ?? 'Unknown',
      allowed: 0,
      denied: 0
    };

    if (attempt.result === 'ALLOWED') {
      entry.allowed += attempt._count._all;
    } else {
      entry.denied += attempt._count._all;
    }
    summary.set(resourceId, entry);
  }

  return [...summary.values()]
    .map((entry) => ({ ...entry, totalAttempts: entry.allowed + entry.denied }))
    .sort((a, b) => b.totalAttempts - a.totalAttempts);
};

export const getUsageByMembershipLevel = async (): Promise<Record<MembershipLevel, number>> => {
  const usages = await prisma.resourceUsage.findMany({
    include: { passenger: { select: { membership: true } } }
  });

  const counts: Record<MembershipLevel, number> = { SILVER: 0, GOLD: 0, PLATINUM: 0 };
  for (const usage of usages) {
    counts[usage.passenger.membership] += 1;
  }
  return counts;
};
