import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../lib/http-error';
import { recordAdminAction } from '../audit/audit.service';
import { CreatePassengerInput, UpdateMembershipInput } from './passenger.types';

export const createPassenger = async (input: CreatePassengerInput, crewLeadId: string) => {
  const passenger = await prisma.passenger.create({ data: input });
  await recordAdminAction({ action: 'PASSENGER_CREATED', crewLeadId, passengerId: passenger.id });
  return passenger;
};

export const listPassengers = async () => {
  return prisma.passenger.findMany({ orderBy: { createdAt: 'desc' } });
};

export const getPassengerById = async (id: string) => {
  const passenger = await prisma.passenger.findUnique({ where: { id } });
  if (!passenger) {
    throw new NotFoundError(`Passenger ${id} not found`);
  }
  return passenger;
};

export const updatePassengerMembership = async (
  id: string,
  input: UpdateMembershipInput,
  crewLeadId: string
) => {
  await getPassengerById(id);
  const passenger = await prisma.passenger.update({
    where: { id },
    data: { membership: input.membership }
  });
  await recordAdminAction({
    action: 'PASSENGER_MEMBERSHIP_UPDATED',
    crewLeadId,
    passengerId: passenger.id,
    metadata: { membership: input.membership }
  });
  return passenger;
};
