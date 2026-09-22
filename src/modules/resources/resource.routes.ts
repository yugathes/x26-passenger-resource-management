import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { requireCrewLead } from '../crew-leads/require-crew-lead.middleware';
import * as resourceController from './resource.controller';

export const resourceRouter = Router();

resourceRouter.post('/', requireCrewLead, asyncHandler(resourceController.create));
resourceRouter.get('/', asyncHandler(resourceController.list));
resourceRouter.get('/:id', asyncHandler(resourceController.getById));
resourceRouter.patch('/:id', requireCrewLead, asyncHandler(resourceController.update));
resourceRouter.patch('/:id/status', requireCrewLead, asyncHandler(resourceController.setStatus));
