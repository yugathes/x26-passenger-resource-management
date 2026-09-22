import { Request, Response } from 'express';
import * as crewLeadService from './crew-lead.service';
import { createCrewLeadSchema } from './crew-lead.types';

export const create = async (req: Request, res: Response): Promise<void> => {
  const input = createCrewLeadSchema.parse(req.body);
  const crewLead = await crewLeadService.createCrewLead(input);
  res.status(201).json(crewLead);
};

export const list = async (_req: Request, res: Response): Promise<void> => {
  const crewLeads = await crewLeadService.listCrewLeads();
  res.status(200).json(crewLeads);
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const crewLead = await crewLeadService.getCrewLeadById(req.params.id);
  res.status(200).json(crewLead);
};
