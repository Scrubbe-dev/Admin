import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import * as waitingService from './waiting.services';
import { CreateWaitingUserInput, GetWaitingUsersInput } from './waiting.schema';
import { ApiError } from '../admin-auth/admin.utils';

export const createWaitingUser: RequestHandler = asyncHandler(async (req, res) => {
  const { body } = req as CreateWaitingUserInput;
  
  const existingUser = await waitingService.getUserByEmail(body.email);
  if (existingUser) {
    throw new ApiError(409, 'Email already exists in waiting list');
  }

  const user = await waitingService.createWaitingUser(body);
  res.status(201).json({
    success: true,
    data: user
  });
});



export const getWaitingUsers: RequestHandler = asyncHandler(async (req, res) => {
    const { query } = req as unknown as GetWaitingUsersInput;
    const result = await waitingService.getWaitingUsers(query);
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  });