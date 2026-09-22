import { prisma } from '../../db/prisma';
import { ConflictError, NotFoundError } from '../../lib/http-error';
import { CreateCrewLeadInput } from './crew-lead.types';

// The PRMS operates with a fixed crew-lead roster; a 4th cannot be onboarded without retiring one first
export const MAX_CREW_LEADS = 3;

export const createCrewLead = async (input: CreateCrewLeadInput) => {
  const count = await prisma.crewLead.count();
  if (count >= MAX_CREW_LEADS) {
    throw new ConflictError(`Maximum of ${MAX_CREW_LEADS} crew leads already exist`);
  }
  return prisma.crewLead.create({ data: input });
};

export const listCrewLeads = async () => {
  return prisma.crewLead.findMany({ orderBy: { createdAt: 'asc' } });
};

export const getCrewLeadById = async (id: string) => {
  const crewLead = await prisma.crewLead.findUnique({ where: { id } });
  if (!crewLead) {
    throw new NotFoundError(`Crew lead ${id} not found`);
  }
  return crewLead;
};
