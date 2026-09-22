import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Reuses an existing crew lead if one exists so tests never collide with the 3-crew-lead cap
export const getOrCreateCrewLeadId = async (): Promise<string> => {
  const existing = await prisma.crewLead.findFirst();
  if (existing) {
    return existing.id;
  }

  const created = await prisma.crewLead.create({
    data: {
      name: 'Seed Crew Lead',
      email: `seed-crew-lead-${Date.now()}@test.com`,
      role: 'OPERATIONS'
    }
  });
  return created.id;
};
