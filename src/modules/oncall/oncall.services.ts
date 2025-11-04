import { PrismaClient } from '@prisma/client';
import { CreateOnCallAssignmentRequest, OnCallAssignmentResponse, GetAllAssignmentsResponse } from './oncall.types';
import { DateUtils } from './oncall.utils';
import { OnCallAssignmentEmailData, OnCallEmailService } from './oncall-email.services';

const prisma = new PrismaClient();

export class OnCallService {

  private emailService: OnCallEmailService;

  constructor() {
    this.emailService = new OnCallEmailService();
  }

  async createAssignment(data: CreateOnCallAssignmentRequest): Promise<OnCallAssignmentResponse> {
    // Check for overlapping assignments for team members on the same date
    await this.checkForOverlappingAssignments(data);

    // Create the assignment with transaction
    return await prisma.$transaction(async (tx) => {
      // Create the main assignment
      const assignment = await tx.onCallAssignment.create({
        data: {
          date: new Date(data.date),
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

      await this.sendAssignmentNotifications(assignment);

      return this.formatAssignmentResponse(assignment);
    });
  }

    private async sendAssignmentNotifications(assignment: any): Promise<void> {
    try {
      const emailDataList: OnCallAssignmentEmailData[] = assignment.teamMembers.map((tm: any) => ({
        email: tm.member.email,
        firstName: tm.member.firstName,
        lastName: tm.member.lastName,
        date: assignment.date.toISOString().split('T')[0],
        startTime: tm.startTime,
        endTime: tm.endTime,
        assignmentId: assignment.id
      }));

      await this.emailService.sendBulkAssignmentNotifications(emailDataList);
      
      console.log(`✅ Sent ${emailDataList.length} on-call assignment notifications`);
    } catch (error) {
      // Log the error but don't fail the assignment creation
      console.error('❌ Failed to send assignment notifications:', error);
      // You might want to implement a retry mechanism or queue system here
    }
  }


  async getAllAssignments(userId: string): Promise<GetAllAssignmentsResponse[]> {
    const assignments = await prisma.onCallAssignment.findMany({
      where: { id:userId},
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
        date: 'desc'
      }
    });

    return assignments.map(assignment => this.formatGetAllResponse(assignment));
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
    const assignmentDate = new Date(data.date);

    for (const teamMember of data.teamMembers) {
      const existingAssignments = await prisma.onCallTeamMember.findMany({
        where: {
          memberId: teamMember.member,
          assignment: {
            date: assignmentDate,
            status: 'ACTIVE'
          }
        },
        include: {
          assignment: true
        }
      });

      if (existingAssignments.length > 0) {
        throw new Error(
          `User ${teamMember.member} already has an on-call assignment for this date`
        );
      }
    }
  }

  private formatAssignmentResponse(assignment: any): OnCallAssignmentResponse {
    return {
      id: assignment.id,
      date: DateUtils.formatDateForResponse(assignment.date),
      status: assignment.status,
      teamMembers: assignment.teamMembers.map((tm: any) => ({
        id: tm.id,
        email: tm.member.email || null,
        firstName: tm.member.firstName || null,
        lastName: tm.member.lastName || null,
        member: {
          id: tm.member.id,
          email: tm.member.email,
          firstName: tm.member.firstName,
          lastName: tm.member.lastName
        },
        startTime: tm.startTime,
        endTime: tm.endTime
      })),
      createdAt: DateUtils.formatDateTimeForResponse(assignment.createdAt),
      updatedAt: DateUtils.formatDateTimeForResponse(assignment.updatedAt)
    };
  }

  private formatGetAllResponse(assignment: any): GetAllAssignmentsResponse {
    return {
      date: DateUtils.formatDateForResponse(assignment.date),
      teamMembers: assignment.teamMembers.map((tm: any) => ({
        email: tm.member.email,
        firstName: tm.member.firstName,
        lastName: tm.member.lastName,
        member: tm.member.id,
        startTime: tm.startTime,
        endTime: tm.endTime
      }))
    };
  }
}