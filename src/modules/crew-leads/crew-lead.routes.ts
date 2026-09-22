import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import * as crewLeadController from './crew-lead.controller';

export const crewLeadRouter = Router();

// Creation is intentionally open (no auth) to bootstrap the first crew leads; capped at MAX_CREW_LEADS
crewLeadRouter.post('/', asyncHandler(crewLeadController.create));
crewLeadRouter.get('/', asyncHandler(crewLeadController.list));
crewLeadRouter.get('/:id', asyncHandler(crewLeadController.getById));
