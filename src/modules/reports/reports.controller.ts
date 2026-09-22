import { Request, Response } from 'express';
import * as reportsService from './reports.service';

export const passengerUsageHistory = async (req: Request, res: Response): Promise<void> => {
  const history = await reportsService.getPassengerUsageHistory(req.params.id);
  res.status(200).json(history);
};

export const resourceUsageTotals = async (_req: Request, res: Response): Promise<void> => {
  const totals = await reportsService.getResourceUsageTotals();
  res.status(200).json(totals);
};

export const resourceDemandSummary = async (_req: Request, res: Response): Promise<void> => {
  const summary = await reportsService.getResourceDemandSummary();
  res.status(200).json(summary);
};

export const membershipUsageSummary = async (_req: Request, res: Response): Promise<void> => {
  const summary = await reportsService.getUsageByMembershipLevel();
  res.status(200).json(summary);
};
