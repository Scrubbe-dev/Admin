import prisma from '../../prisma-clients/client';
import bcrypt from 'bcrypt';
import { ApiError } from './admin.utils';

const SALT_ROUNDS = 12;

export const createAdmin = async (email: string, password: string) => {
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingAdmin) {
    throw new ApiError(409, 'Admin already exists');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return prisma.admin.create({
    data: {
      email,
      password: hashedPassword
    }
  });
};

export const validateAdminCredentials = async (email: string, password: string) => {
  const admin = await prisma.admin.findUnique({ where: { email } });
  
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  return admin;
};

export const updateAdminPassword = async (
    adminId: string,
    currentPassword: string,
    newPassword: string
  ) => {
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    
    if (!admin) {
      throw new ApiError(404, 'Admin not found');
    }
  
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }
  
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    return prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
      select: { id: true, email: true, createdAt: true }
    });
  };