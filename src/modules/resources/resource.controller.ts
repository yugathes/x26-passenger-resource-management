import { Request, Response } from 'express';
import * as resourceService from './resource.service';
import { createResourceSchema, setResourceStatusSchema, updateResourceSchema } from './resource.types';

export const create = async (req: Request, res: Response): Promise<void> => {
  const input = createResourceSchema.parse(req.body);
  const resource = await resourceService.createResource(input, req.crewLead!.id);
  res.status(201).json(resource);
};

export const list = async (_req: Request, res: Response): Promise<void> => {
  const resources = await resourceService.listResources();
  res.status(200).json(resources);
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const resource = await resourceService.getResourceById(req.params.id);
  res.status(200).json(resource);
};

export const update = async (req: Request, res: Response): Promise<void> => {
  const input = updateResourceSchema.parse(req.body);
  const resource = await resourceService.updateResourceDetails(req.params.id, input, req.crewLead!.id);
  res.status(200).json(resource);
};

export const setStatus = async (req: Request, res: Response): Promise<void> => {
  const input = setResourceStatusSchema.parse(req.body);
  const resource = await resourceService.setResourceStatus(req.params.id, input, req.crewLead!.id);
  res.status(200).json(resource);
};
