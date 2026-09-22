import { prisma } from '../../db/prisma';
import { asyncHandler } from '../../lib/async-handler';
import { UnauthorizedError } from '../../lib/http-error';

// Identifies the acting crew lead for admin-aware endpoints via the x-crew-lead-id header
export const requireCrewLead = asyncHandler(async (req, _res, next) => {
  const crewLeadId = req.header('x-crew-lead-id');
  if (!crewLeadId) {
    throw new UnauthorizedError('x-crew-lead-id header is required for this action');
  }

  const crewLead = await prisma.crewLead.findUnique({ where: { id: crewLeadId } });
  if (!crewLead) {
    throw new UnauthorizedError('Unknown crew lead');
  }

  req.crewLead = crewLead;
  next();
});
