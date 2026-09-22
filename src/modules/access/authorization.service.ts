import { MembershipLevel, Passenger, Resource } from '@prisma/client';

// Ordered lowest to highest so higher tiers inherit access from lower tiers
const MEMBERSHIP_RANK: Record<MembershipLevel, number> = {
  SILVER: 0,
  GOLD: 1,
  PLATINUM: 2
};

export interface AccessDecision {
  allowed: boolean;
  reason?: string;
}

// Pure domain rule: is a passenger's membership + a resource's status sufficient for access?
export const canAccessResource = (passenger: Passenger, resource: Resource): AccessDecision => {
  if (resource.status !== 'ACTIVE') {
    return { allowed: false, reason: `Resource status is ${resource.status}, must be ACTIVE` };
  }

  if (MEMBERSHIP_RANK[passenger.membership] < MEMBERSHIP_RANK[resource.minMembership]) {
    return {
      allowed: false,
      reason: `Passenger membership ${passenger.membership} does not meet required ${resource.minMembership}`
    };
  }

  return { allowed: true };
};
