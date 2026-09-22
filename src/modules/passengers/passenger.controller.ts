import { Request, Response } from 'express';
import * as passengerService from './passenger.service';
import { createPassengerSchema, updateMembershipSchema } from './passenger.types';

export const create = async (req: Request, res: Response): Promise<void> => {
  const input = createPassengerSchema.parse(req.body);
  const passenger = await passengerService.createPassenger(input, req.crewLead!.id);
  res.status(201).json(passenger);
};

export const list = async (_req: Request, res: Response): Promise<void> => {
  const passengers = await passengerService.listPassengers();
  res.status(200).json(passengers);
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  const passenger = await passengerService.getPassengerById(req.params.id);
  res.status(200).json(passenger);
};

export const updateMembership = async (req: Request, res: Response): Promise<void> => {
  const input = updateMembershipSchema.parse(req.body);
  const passenger = await passengerService.updatePassengerMembership(req.params.id, input, req.crewLead!.id);
  res.status(200).json(passenger);
};
