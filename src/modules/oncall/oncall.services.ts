import { PrismaClient } from '@prisma/client';
import { CreateOnCallAssignmentRequest, OnCallAssignmentResponse } from './oncall.types';
import { DateUtils } from './oncall.utils';

const prisma = new PrismaClient();

export class OnCallService {
  async createAssignment(data: CreateOnCallAssignmentRequest): Promise<OnCallAssignmentResponse> {
    // Check for overlapping assignments for team members
    await this.checkForOverlappingAssignments(data);

    // Create the assignment with transaction
    return await prisma.$transaction(async (tx) => {
      // Create the main assignment
      const assignment = await tx.onCallAssignment.create({
        data: {
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          teamMembers: {
            create: data.teamMembers.map(member => ({
              memberId: member.member,
              startTime: member.startTime,
              endTime: member.endTime
            }))
          }
        },
        include: {
          teamMembers: {
            include: {
              member: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      return this.formatAssignmentResponse(assignment);
    });
  }

  async getAllAssignments(): Promise<OnCallAssignmentResponse[]> {
    const assignments = await prisma.onCallAssignment.findMany({
      include: {
        teamMembers: {
          include: {
            member: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return assignments.map(assignment => this.formatAssignmentResponse(assignment));
  }

  async getAssignmentById(id: string): Promise<OnCallAssignmentResponse | null> {
    const assignment = await prisma.onCallAssignment.findUnique({
      where: { id },
      include: {
        teamMembers: {
          include: {
            member: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    return assignment ? this.formatAssignmentResponse(assignment) : null;
  }

  private async checkForOverlappingAssignments(data: CreateOnCallAssignmentRequest): Promise<void> {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    for (const teamMember of data.teamMembers) {
      const existingAssignments = await prisma.onCallTeamMember.findMany({
        where: {
          memberId: teamMember.member,
          assignment: {
            status: 'ACTIVE',
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate }
              }
            ]
          }
        },
        include: {
          assignment: true
        }
      });

      if (existingAssignments.length > 0) {
        throw new Error(
          `User ${teamMember.member} already has overlapping on-call assignments`
        );
      }
    }
  }

  private formatAssignmentResponse(assignment: any): OnCallAssignmentResponse {
    return {
      id: assignment.id,
      startDate: DateUtils.formatDateForResponse(assignment.startDate),
      endDate: DateUtils.formatDateForResponse(assignment.endDate),
      status: assignment.status,
      teamMembers: assignment.teamMembers.map((tm: any) => ({
        id: tm.id,
        member: {
          id: tm.member.id,
          email: tm.member.email,
          firstName: tm.member.firstName,
          lastName: tm.member.lastName
        },
        startTime: tm.startTime,
        endTime: tm.endTime
      })),
      createdAt: DateUtils.formatDateForResponse(assignment.createdAt),
      updatedAt: DateUtils.formatDateForResponse(assignment.updatedAt)
    };
  }
}