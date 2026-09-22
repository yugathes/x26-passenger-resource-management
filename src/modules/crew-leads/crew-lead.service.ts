import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../lib/http-error';
import { CreateCrewLeadInput } from './crew-lead.types';
import { z } from 'zod';

// The PRMS operates with a fixed crew-lead roster; a 4th cannot be onboarded without retiring one first
export const MAX_CREW_LEADS = 3;

export const createCrewLead = async (input: CreateCrewLeadInput) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const count = await transaction.crewLead.count();
        if (count >= MAX_CREW_LEADS) {
          throw new ConflictError(`Maximum of ${MAX_CREW_LEADS} crew leads already exist`);
        }
        return transaction.crewLead.create({ data: input });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034' || attempt === 2) {
        throw error;
      }
    }
  }

  throw new ConflictError(`Maximum of ${MAX_CREW_LEADS} crew leads already exist`);
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

export const getVerifiedCrewLead = async (id: string) => {
  if (!z.string().uuid().safeParse(id).success) {
    throw new UnauthorizedError('Invalid crew lead id');
  }

  const crewLead = await prisma.crewLead.findUnique({ where: { id } });
  if (!crewLead) {
    throw new UnauthorizedError('Unknown crew lead');
  }

  return crewLead;
};
