import { Request, Response } from 'express';
import { OnCallService } from './oncall.services';
import { OnCallValidator } from './oncall.utils';
import { ValidationResult } from './oncall.types';

const onCallService = new OnCallService();

export class OnCallController {
  async assignMember(req: Request, res: Response) {
    try {
      // Validate request body
      const validationResult: ValidationResult = OnCallValidator.validateCreateAssignment(req.body);
       
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors
        });
      }

      // Check if user exists for each team member
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      for (const member of req.body.teamMembers) {
        const user = await prisma.user.findUnique({
          where: { id: member.member }
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: `User with id ${member.member} not found`
          });
        }
      }

      // Create assignment
      const assignment = await onCallService.createAssignment(req.body);

      return res.status(201).json({
        success: true,
        message: 'On-call assignment created successfully',
        data: assignment
      });

    } catch (error: any) {
      console.error('Error creating on-call assignment:', error);

      if (error.message.includes('already has an on-call assignment')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getAllAssignments(req: Request, res: Response) {
    try {
      const assignments = await onCallService.getAllAssignments();
      console.log(assignments, "============Assignments=============")
      return res.status(200).json({
        success: true,
        message: 'On-call assignments retrieved successfully',
        data: assignments
      });

    } catch (error: any) {
      console.error('Error retrieving on-call assignments:', error);

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getAssignmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const assignment = await onCallService.getAssignmentById(id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'On-call assignment not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'On-call assignment retrieved successfully',
        data: assignment
      });

    } catch (error: any) {
      console.error('Error retrieving on-call assignment:', error);

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}