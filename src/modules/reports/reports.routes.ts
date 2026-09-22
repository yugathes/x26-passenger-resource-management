import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { requireCrewLead } from '../crew-leads/require-crew-lead.middleware';
import * as reportsController from './reports.controller';

export const reportsRouter = Router();

// All analytics endpoints are crew-lead-only
reportsRouter.use(requireCrewLead);

reportsRouter.get('/passengers/:id/usage', asyncHandler(reportsController.passengerUsageHistory));
reportsRouter.get('/resources/usage', asyncHandler(reportsController.resourceUsageTotals));
reportsRouter.get('/resources/demand', asyncHandler(reportsController.resourceDemandSummary));
reportsRouter.get('/membership-usage', asyncHandler(reportsController.membershipUsageSummary));
