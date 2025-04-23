import { Prisma } from '@prisma/client';
import prisma from '../../prisma-clients/client';
import { ApiError } from '../admin-auth/admin.utils';
import { CreateWaitingUserInput, GetWaitingUsersInput } from './waiting.schema';

export const createWaitingUser = async (input: CreateWaitingUserInput['body']) => {
    const existingUser = await getUserByEmail(input.email);
    if (existingUser) {
      throw new ApiError(409, 'Email already exists in waiting list');
    }
  
  return prisma.waitingUser.create({
    data: input
  });
};

export const getWaitingUsers = async (query: GetWaitingUsersInput['query']) => {
  const { page, limit, role, search } = query;
  
  const where: Prisma.WaitingUserWhereInput = {
    ...(role && { role }),
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ] as Prisma.WaitingUserWhereInput['OR']
    })
  };

  const [users, total] = await Promise.all([
    prisma.waitingUser.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.waitingUser.count({ where })
  ]);

  return {
    data: users,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getUserByEmail = async (email: string) => {
    return prisma.waitingUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true
      }
    });
  };
  