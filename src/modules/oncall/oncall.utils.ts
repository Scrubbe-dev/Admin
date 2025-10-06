import { CreateOnCallAssignmentRequest, ValidationResult } from './oncall.types';

export class OnCallValidator {
  static validateCreateAssignment(data: any): ValidationResult {
    const errors: string[] = [];

    // Validate date
    if (!data.date || typeof data.date !== 'string') {
      errors.push('date is required and must be a string');
    } else if (!this.isValidDate(data.date)) {
      errors.push('date must be a valid ISO date string');
    }

    // Validate teamMembers
    if (!Array.isArray(data.teamMembers) || data.teamMembers.length === 0) {
      errors.push('teamMembers is required and must be a non-empty array');
    } else {
      data.teamMembers.forEach((member: any, index: number) => {
        if (!member.member || typeof member.member !== 'string') {
          errors.push(`teamMembers[${index}].member is required and must be a string`);
        }
        
        if (!member.startTime || !this.isValidTime(member.startTime)) {
          errors.push(`teamMembers[${index}].startTime is required and must be in HH:mm format`);
        }
        
        if (!member.endTime || !this.isValidTime(member.endTime)) {
          errors.push(`teamMembers[${index}].endTime is required and must be in HH:mm format`);
        }
        
        if (member.startTime && member.endTime && !this.isValidTimeRange(member.startTime, member.endTime)) {
          errors.push(`teamMembers[${index}].endTime must be after startTime`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  private static isValidTime(timeString: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  }

  private static isValidTimeRange(startTime: string, endTime: string): boolean {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    return endTotal > startTotal;
  }
}

export class DateUtils {
  static formatDateForResponse(date: Date): string {
    return date.toISOString().split('T')[0]; // Return only YYYY-MM-DD
  }

  static formatDateTimeForResponse(date: Date): string {
    return date.toISOString();
  }
}