import { Priority } from "@prisma/client";
import { EmailPayload } from "./email-integration.types";

export class EmailIntegrationUtil {
  constructor() {}

  static parseIncidentEmail(payload: EmailPayload) {
    const subject = payload.subject.trim();

    const bodyLines = payload.body
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const bodyData: Record<string, string> = {};
    for (const line of bodyLines) {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) {
        bodyData[key.trim().toLowerCase()] = rest.join(":").trim();
      }
    }

    // Only handle Raise
    if (/^raise:/i.test(subject)) {
      return {
        action: "raise",
        incident: {
          template: bodyData.template || "NONE",
          reason: bodyData.reason || "",
          priority: (
            this.normalizePriority(bodyData.priority) || "LOW"
          ).toUpperCase(),
          username: bodyData.username || "",
          assignedTo: bodyData.assignedto || "",
          fromEmail: payload.from,
        },
      };
    }

    throw new Error("Unknown subject format. Must start with Raise:");
  }

  static normalizePriority(priority: string) {
    const priorityMap: Record<string, Priority> = {
      high: Priority.HIGH,
      medium: Priority.MEDIUM,
      low: Priority.LOW,
      critical: Priority.CRITICAL,
    };

    if (priority) {
      const key = priority.toLowerCase();
      return priorityMap[key] || null;
    }
    return null;
  }
}
