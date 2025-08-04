import { IncidentTicket, Priority } from "@prisma/client";
import { RecommendedActionResponse, RiskScore } from "../ezra-chat/ezra.types";
import { askEzra } from "../ezra-chat/askezra";

export class IncidentUtils {
  constructor() {}

  static generateTicketId() {
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
    return `INC${randomNumber}`;
  }

  static calculateSLADueDate(
    ticketCreatedTime: Date,
    priority: Priority
  ): Date {
    const slaThresholds: Record<Priority, number> = {
      [Priority.CRITICAL]: 15,
      [Priority.HIGH]: 60,
      [Priority.MEDIUM]: 360,
      [Priority.LOW]: 1440, // 24 hours
    };

    const slaMinutes = slaThresholds[priority];
    return new Date(ticketCreatedTime.getTime() + slaMinutes * 60 * 1000);
  }
  static async ezraDetermineRiskScore(incidentTicket: IncidentTicket) {
    try {
      return await askEzra<RiskScore>(
        "determineRiskScore",
        JSON.stringify(incidentTicket),
        incidentTicket
      );
    } catch (error) {
      console.error(
        `Ezra failed to determine risk score: ${
          error instanceof Error && error.message
        }`
      );
    }
  }

  static async ezraRecommendedActions(incidentTicket: IncidentTicket) {
    try {
      return await askEzra<RecommendedActionResponse>(
        "recommendedAction",
        JSON.stringify(incidentTicket),
        incidentTicket
      );
    } catch (error) {
      console.error(
        `Ezra failed to determine risk score: ${
          error instanceof Error && error.message
        }`
      );
    }
  }
}
