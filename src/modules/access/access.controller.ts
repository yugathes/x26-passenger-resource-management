import { Request, Response } from 'express';
import * as accessService from './access.service';
import { accessResourceSchema } from './access.types';

export const attemptAccess = async (req: Request, res: Response): Promise<void> => {
  const input = accessResourceSchema.parse(req.body);
  const result = await accessService.attemptResourceAccess(input);

  if (!result.allowed) {
    res.status(403).json(result);
    return;
  }

  res.status(201).json(result);
};
