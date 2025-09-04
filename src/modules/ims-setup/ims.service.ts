import { PrismaClient, Role, AccessPermissions } from '@prisma/client';
import { 
  BusinessCreationData, 
  InviteCreationData, 
  IMSSetupRequest, 
  IMSSetupResponse 
} from './ims.type';
import { IMSEmailService } from './ims.emailService';
import { generateRandomString } from './ims.helpers';
import { generateDomain } from './ims.utils';

const prisma = new PrismaClient();


export class IMSService {
  /**
   * Setup IMS for a new company
   */
  static async setupIMS(
    userId: string, 
    requestData: IMSSetupRequest
  ): Promise<IMSSetupResponse> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user already has a business
      const existingBusiness = await prisma.business.findUnique({
        where: { userId }
      });

      if (existingBusiness) {
        throw new Error('User already has a business setup');
      }

      // Start transaction for atomic operations
      return await prisma.$transaction(async (tx) => {
        // 1. Create Business
        const businessData: BusinessCreationData = {
          name: requestData.companyName,
          companySize: requestData.companySize,
          userId: userId,
        };

        const business = await tx.business.create({
          data: businessData
        });

        // 2. Create Business Dashboard
        const dashboard = await tx.businessDashboard.create({
          data: {
            businessId: business.id,
            colorAccent: '#4A90E2',
            defaultDashboard: 'SCRUBBE_DASHBOARD_SOUR',
            prefferedIntegration: ['JIRA'],
            notificationChannels: ['EMAIL'],
            defaultPriority: ['MEDIUM']
          }
        });

        // 3. Process invitations
        const inviteResults = await this.processInvitations(
          tx, 
          requestData.inviteMembers, 
          business.id,
          {...user,firstName: user.firstName || '', lastName: user.lastName || ''} 
        );

        // 4. Update business with dashboard ID
        await tx.business.update({
          where: { id: business.id },
          data: { dashBoardId: dashboard.id }
        });

        return {
          success: true,
          message: 'IMS setup completed successfully',
          businessId: business.id,
          dashboardId: dashboard.id,
          invitesSent: inviteResults.sent,
          totalInvites: inviteResults.total,
          domain: generateDomain(requestData.companyName)
        };
      });

    } catch (error:any) {
      console.error('IMS Setup Error:', error);
      throw new Error(`Failed to setup IMS: ${error.message}`);
    }
  }

  /**
   * Process member invitations
   */
  private static async processInvitations(
    tx: any,
    inviteMembers: any[],
    businessId: string,
    user: { id: string; email: string; firstName?: string; lastName?: string }
  ): Promise<{ sent: number; total: number }> {
    let sentCount = 0;
    const emailService = new IMSEmailService();
    for (const member of inviteMembers) {
      try {
        const inviteData: InviteCreationData = {
          email: member.inviteEmail,
          role: member.role,
          accessPermissions: member.accessPermissions,
          sentById: businessId,
          Level: member.Level
        };

        // Check if invite already exists for this email and business
        const existingInvite = await tx.invites.findUnique({
          where: {
            email_sentById: {
              email: member.inviteEmail,
              sentById: businessId
            }
          }
        });

        if (existingInvite) {
          console.log(`Invite already exists for ${member.inviteEmail}`);
          continue;
        }

        // Create invite
        const invite = await tx.invites.create({
          data: inviteData
        });
       
        const existingBusiness = await prisma.business.findUnique({
        where: { id: businessId}
      });

        // Send invitation email
    await emailService.sendIMSInvitation(
        member.inviteEmail,
        `${user.firstName} ${user.lastName}`.trim() || user.email,
        existingBusiness?.name || '', // Company name from business
        member.role,
        member.Level,
        invite.id // Using invite ID as token for now
      );
        sentCount++;

      } catch (inviteError) {
        console.error(`Failed to process invite for ${member.inviteEmail}:`, inviteError);
        // Continue with other invites even if one fails
      }
    }

    return { sent: sentCount, total: inviteMembers.length };
  }

  /**
   * Validate IMS setup request
   */
  static validateIMSSetupRequest(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.companyName || typeof data.companyName !== 'string' || data.companyName.trim().length === 0) {
      errors.push('Company name is required');
    }

    if (!data.companySize || typeof data.companySize !== 'string' || data.companySize.trim().length === 0) {
      errors.push('Company size is required');
    }

    if (!Array.isArray(data.inviteMembers)) {
      errors.push('Invite members must be an array');
    } else {
      data.inviteMembers.forEach((member: any, index: number) => {
        if (!member.inviteEmail || !this.isValidEmail(member.inviteEmail)) {
          errors.push(`Member ${index + 1}: Valid email is required`);
        }

        if (!member.role || !Object.values(Role).includes(member.role)) {
          errors.push(`Member ${index + 1}: Valid role is required`);
        }

        if (!Array.isArray(member.accessPermissions) || member.accessPermissions.length === 0) {
          errors.push(`Member ${index + 1}: Access permissions are required`);
        } else {
          member.accessPermissions.forEach((permission: any) => {
            if (!Object.values(AccessPermissions).includes(permission)) {
              errors.push(`Member ${index + 1}: Invalid access permission: ${permission}`);
            }
          });
        }

        if (!member.Level || typeof member.Level !== 'string' || member.Level.trim().length === 0) {
          errors.push(`Member ${index + 1}: Level is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Simple email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}