import { createEmailServiceWithResend } from '../auth/services/resend-no-nodemailer.factory';

export interface OnCallAssignmentEmailData {
  email: string;
  firstName: string | null;
  lastName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  assignmentId: string;
}

export class OnCallEmailService {
  private emailService;

  constructor() {
    this.emailService = createEmailServiceWithResend();
  }

  async sendAssignmentNotification(emailData: OnCallAssignmentEmailData): Promise<void> {
    try {
      const fullName = `${emailData.firstName || ''} ${emailData.lastName || ''}`.trim() || 'Team Member';
      
      await this.emailService.sendOnCallAssignmentEmail(
        emailData.email,
        fullName,
        {
          date: emailData.date,
          startTime: emailData.startTime,
          endTime: emailData.endTime,
          assignmentId: emailData.assignmentId
        }
      );
      
      console.log(`✅ On-call assignment email sent to: ${emailData.email}`);
    } catch (error) {
      console.error(`❌ Failed to send on-call assignment email to ${emailData.email}:`, error);
      throw new Error(`Failed to send on-call assignment notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendBulkAssignmentNotifications(emailDataList: OnCallAssignmentEmailData[]): Promise<void> {
    const results = await Promise.allSettled(
      emailDataList.map(data => this.sendAssignmentNotification(data))
    );

    const failed = results.filter(result => result.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length} on-call assignment emails failed to send`);
    }
  }
}