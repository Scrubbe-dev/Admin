import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import * as adminService from './admin.services';
import { ApiError } from './admin.utils';

export const registerAdmin: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const admin = await adminService.createAdmin(email, password);
  
  res.status(201).json({
    success: true,
    data: {
      id: admin.id,
      email: admin.email
    }
  });
});

export const loginAdmin: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const admin = await adminService.validateAdminCredentials(email, password);
  const token = jwt.sign(
    { sub: admin.id, email: admin.email },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' }
  );

  res.status(200).json({
    success: true,
    data: { token }
  });
});


export const updatePassword: RequestHandler = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user?.sub;
  
    if (!adminId) {
      throw new ApiError(401, 'Authentication required');
    }
  
    const updatedAdmin = await adminService.updateAdminPassword(
      adminId,
      currentPassword,
      newPassword
    );
  
    res.status(200).json({
      success: true,
      data: updatedAdmin,
      message: 'Password updated successfully'
    });
  });




export const deleteAdmin: RequestHandler = asyncHandler(async (req, res) => {
  const { adminId } = req.params;
  const requestingAdminId = req.user?.sub;
  
  if (!requestingAdminId) {
    throw new ApiError(401, 'Authentication required');
  }
  
  // Prevent admin from deleting themselves
  if (adminId === requestingAdminId) {
    throw new ApiError(400, 'Admin cannot delete their own account');
  }
  
  await adminService.deleteAdmin(adminId);
  
  res.status(200).json({
    success: true,
    message: 'Admin deleted successfully'
  });
});