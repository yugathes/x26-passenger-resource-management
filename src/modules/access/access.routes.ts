import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import * as accessController from './access.controller';

export const accessRouter = Router();

accessRouter.post('/', asyncHandler(accessController.attemptAccess));
