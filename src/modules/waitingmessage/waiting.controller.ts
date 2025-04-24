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
  try{
    res.status(201).json({
      success: true,
      data: user
    });
  }catch(error:any){
    console.log(error);
  }
});

export const getWaitingUsers: RequestHandler = asyncHandler(async (req, res) => {
    const { query } = req as unknown as GetWaitingUsersInput;
     try{
       const result = await waitingService.getWaitingUsers(query);
       res.status(200).json({
         success: true,
         data: result.data,
         meta: result.meta
       });
     }catch(error:any){
      console.log(error)
     }
  });


  export const deleteWaitingUser: RequestHandler = asyncHandler(async (req, res) => {
    try{
    const { id } = req.params;
    
    if (!id) {
      throw new ApiError(400, 'Waiting user ID is required');
    }
  
    await waitingService.deleteWaitingUser(id);
    res.status(200).json({
      success: true,
      message: 'Waiting user deleted successfully'
    });
  }catch(error:any){
    console.log(error)
  }
  });



  export const allWaitingUser: RequestHandler = asyncHandler(async (req, res) => {
   try{
   const allUsers = await waitingService.getAllWaitingUser();
    res.status(200).json(allUsers);
  }catch(error:any){
    console.log(error)
  }
  });