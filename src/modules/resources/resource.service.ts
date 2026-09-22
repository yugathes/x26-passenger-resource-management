import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { NotFoundError } from '../../lib/http-error';
import { recordAdminAction } from '../audit/audit.service';
import { CreateResourceInput, SetResourceStatusInput, UpdateResourceInput } from './resource.types';

export const createResource = async (input: CreateResourceInput, crewLeadId: string) => {
  const resource = await prisma.resource.create({ data: input });
  await recordAdminAction({ action: 'RESOURCE_CREATED', crewLeadId, resourceId: resource.id });
  return resource;
};

export const listResources = async () => {
  return prisma.resource.findMany({ orderBy: { createdAt: 'desc' } });
};

export const getResourceById = async (id: string) => {
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) {
    throw new NotFoundError(`Resource ${id} not found`);
  }
  return resource;
};

export const updateResourceDetails = async (id: string, input: UpdateResourceInput, crewLeadId: string) => {
  await getResourceById(id);
  const resource = await prisma.resource.update({ where: { id }, data: input });
  await recordAdminAction({
    action: 'RESOURCE_UPDATED',
    crewLeadId,
    resourceId: resource.id,
    metadata: input as Prisma.InputJsonValue
  });
  return resource;
};

export const setResourceStatus = async (id: string, input: SetResourceStatusInput, crewLeadId: string) => {
  await getResourceById(id);
  const resource = await prisma.resource.update({ where: { id }, data: { status: input.status } });
  await recordAdminAction({
    action: 'RESOURCE_STATUS_CHANGED',
    crewLeadId,
    resourceId: resource.id,
    metadata: { status: input.status }
  });
  return resource;
};
