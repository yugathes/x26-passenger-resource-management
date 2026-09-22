import { asyncHandler } from '../../lib/async-handler';
import { UnauthorizedError } from '../../lib/http-error';
import { getVerifiedCrewLead } from './crew-lead.service';

// Identifies the acting crew lead for admin-aware endpoints via the x-crew-lead-id header
export const requireCrewLead = asyncHandler(async (req, _res, next) => {
  const crewLeadId = req.header('x-crew-lead-id');
  if (!crewLeadId) {
    throw new UnauthorizedError('x-crew-lead-id header is required for this action');
  }

  req.crewLead = await getVerifiedCrewLead(crewLeadId);
  next();
});
