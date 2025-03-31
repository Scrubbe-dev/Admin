import { Request, Response } from 'express';
import { SystemService } from './system.service';

const systemService = new SystemService();

export const getSystemInfoHandler = async (req: Request, res: Response) => {
  try {
    const systemInfo = await systemService.collectSystemInfo(req);
    
    res.status(200).json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system information'
    });
  }
};