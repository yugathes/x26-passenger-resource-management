import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { requireCrewLead } from '../crew-leads/require-crew-lead.middleware';
import * as passengerController from './passenger.controller';

export const passengerRouter = Router();

passengerRouter.post('/', requireCrewLead, asyncHandler(passengerController.create));
passengerRouter.get('/', asyncHandler(passengerController.list));
passengerRouter.get('/:id', asyncHandler(passengerController.getById));
passengerRouter.patch('/:id/membership', requireCrewLead, asyncHandler(passengerController.updateMembership));
