import { CreateOnCallAssignmentRequest, ValidationResult } from './oncall.types';

export class OnCallValidator {
  static validateCreateAssignment(data: any): ValidationResult {
    const errors: string[] = [];

    // Validate startDate
    if (!data.startDate || typeof data.startDate !== 'string') {
      errors.push('startDate is required and must be a string');
    } else if (!this.isValidDate(data.startDate)) {
      errors.push('startDate must be a valid ISO date string');
    }

    // Validate endDate
    if (!data.endDate || typeof data.endDate !== 'string') {
      errors.push('endDate is required and must be a string');
    } else if (!this.isValidDate(data.endDate)) {
      errors.push('endDate must be a valid ISO date string');
    }

    // Validate date range
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      
      if (start >= end) {
        errors.push('endDate must be after startDate');
      }
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
    return date.toISOString();
  }

  static areDatesOverlapping(
    start1: Date, 
    end1: Date, 
    start2: Date, 
    end2: Date
  ): boolean {
    return start1 < end2 && start2 < end1;
  }
}