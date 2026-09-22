import { PrismaClient, MembershipLevel, ResourceStatus, ResourceAccessResult } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.resourceUsage.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.crewLead.deleteMany();

  const crewLeads = await Promise.all([
    prisma.crewLead.create({
      data: { name: 'Alicia Gomez', email: 'alicia@x26.com', role: 'OPERATIONS' },
    }),
    prisma.crewLead.create({
      data: { name: 'Marcus Chen', email: 'marcus@x26.com', role: 'LOGISTICS' },
    }),
    prisma.crewLead.create({
      data: { name: 'Priya Shah', email: 'priya@x26.com', role: 'SAFETY' },
    }),
  ]);

  const passengers = await Promise.all([
    prisma.passenger.create({
      data: { name: 'Jamie Lee', email: 'jamie@x26.com', membership: MembershipLevel.SILVER },
    }),
    prisma.passenger.create({
      data: { name: 'Omar Hassan', email: 'omar@x26.com', membership: MembershipLevel.GOLD },
    }),
    prisma.passenger.create({
      data: { name: 'Sofia Rossi', email: 'sofia@x26.com', membership: MembershipLevel.PLATINUM },
    }),
    prisma.passenger.create({
      data: { name: 'Nina Patel', email: 'nina@x26.com', membership: MembershipLevel.SILVER },
    }),
  ]);

  const resources = await Promise.all([
    prisma.resource.create({
      data: {
        name: 'Food Supply Station',
        type: 'SUPPLY',
        status: ResourceStatus.ACTIVE,
        minMembership: MembershipLevel.SILVER,
      },
    }),
    prisma.resource.create({
      data: {
        name: 'Sleeping Pod',
        type: 'REST',
        status: ResourceStatus.ACTIVE,
        minMembership: MembershipLevel.SILVER,
      },
    }),
    prisma.resource.create({
      data: {
        name: 'Private Cabin',
        type: 'LIVING',
        status: ResourceStatus.ACTIVE,
        minMembership: MembershipLevel.GOLD,
      },
    }),
    prisma.resource.create({
      data: {
        name: 'Advanced Medical Bay',
        type: 'MEDICAL',
        status: ResourceStatus.ACTIVE,
        minMembership: MembershipLevel.GOLD,
      },
    }),
    prisma.resource.create({
      data: {
        name: 'Luxury O2 Pod',
        type: 'WELLNESS',
        status: ResourceStatus.ACTIVE,
        minMembership: MembershipLevel.PLATINUM,
      },
    }),
  ]);

  const usageRecords = await Promise.all([
    prisma.resourceUsage.create({
      data: {
        passengerId: passengers[0].id,
        resourceId: resources[0].id,
        accessedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
    }),
    prisma.resourceUsage.create({
      data: {
        passengerId: passengers[1].id,
        resourceId: resources[2].id,
        accessedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
    }),
    prisma.resourceUsage.create({
      data: {
        passengerId: passengers[2].id,
        resourceId: resources[4].id,
        accessedAt: new Date(Date.now() - 1000 * 60 * 60 * 7),
      },
    }),
  ]);

  await Promise.all([
    prisma.auditLog.create({
      data: {
        action: 'RESOURCE_ACCESS_ATTEMPT',
        result: ResourceAccessResult.ALLOWED,
        passengerId: passengers[0].id,
        resourceId: resources[0].id,
        reason: 'Access permitted by membership',
        metadata: { source: 'seed' },
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'RESOURCE_ACCESS_ATTEMPT',
        result: ResourceAccessResult.ALLOWED,
        passengerId: passengers[1].id,
        resourceId: resources[2].id,
        reason: 'Access permitted by membership',
        metadata: { source: 'seed' },
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'RESOURCE_ACCESS_ATTEMPT',
        result: ResourceAccessResult.DENIED,
        passengerId: passengers[0].id,
        resourceId: resources[4].id,
        reason: 'Passenger membership does not meet required PLATINUM',
        metadata: { source: 'seed', denied: true },
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'PASSENGER_CREATED',
        result: ResourceAccessResult.ALLOWED,
        passengerId: passengers[3].id,
        crewLeadId: crewLeads[0].id,
        reason: 'Passenger onboarded by crew lead',
        metadata: { source: 'seed' },
      },
    }),
  ]);

  console.log('Seed data created');
  console.log({ crewLeads: crewLeads.length, passengers: passengers.length, resources: resources.length, usages: usageRecords.length });
}

main()
  .catch((e) => {
    console.error('Seed failed');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
