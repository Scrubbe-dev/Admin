import { Priority, PrismaClient } from "@prisma/client";
import { TimeFrame } from "./ezra.types";

export class EzraUtils {
  constructor(private prisma: PrismaClient) {}

  fetchIncidentsbyId = async (
    userId: string,
    priority: string | null,
    timeframe: TimeFrame
  ) => {
    try {
      const normalized = await this.normalizePriorityAndTimeframe(
        priority,
        timeframe
      );

      const incidents = await this.prisma.incident.findMany({
        where: {
          assigneeId: userId,
          ...(normalized.priority && { priority: normalized.priority }),
          createdAt: {
            gte: normalized.timeframe.start,
            lte: normalized.timeframe.end,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      });

      return incidents;
    } catch (error) {
      console.error("Error fetching incidents:", error);
      throw new Error("Failed to fetch incidents");
    }
  };

  private async normalizePriorityAndTimeframe(
    priority: string | null,
    timeframe: TimeFrame
  ) {
    const priorityMap: Record<string, Priority> = {
      high: "HIGH",
      medium: "MEDIUM",
      low: "LOW",
      critical: "CRITICAL",
    };

    let normalizedPriority: Priority | null = null;

    if (priority) {
      const key = priority.toLowerCase();
      if (priorityMap[key]) {
        normalizedPriority = priorityMap[key];
      }
    }

    const { start, end } = await this.remapDateRangeToCurrent(timeframe);

    return {
      priority: normalizedPriority,
      timeframe: { start, end },
    };
  }

  private remapDateRangeToCurrent = async (
    range: TimeFrame
  ): Promise<TimeFrame> => {
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid date input to remapDateRangeToCurrent");
    }

    // Duration (in ms)
    const duration = endDate.getTime() - startDate.getTime();

    const now = new Date();
    const todayMidnightUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );

    const newEnd = new Date(todayMidnightUTC);
    const newStart = new Date(todayMidnightUTC - duration);

    return { start: newStart, end: newEnd };
  };
}
