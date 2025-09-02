import { Request, Response, NextFunction } from 'express';
import { IMSService } from './ims.service';

export const validateIMSSetup = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const validation = IMSService.validateIMSSetupRequest(req.body);
  
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors
    });
    return;
  }

  next();
};