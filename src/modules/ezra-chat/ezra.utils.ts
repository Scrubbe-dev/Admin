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
      console.log(
        "======================= fetchIncidentsbyId called with: =======================",
        userId,
        priority,
        timeframe
      );

      const { priority: normalizedPriority, timeframe: cleanTimeframe } =
        this.normalizePriorityAndTimeframe(priority, timeframe);

      console.log(
        "======================= normalized priority and timeframe: =======================",
        priority,
        timeframe
      );

      const incidents = await this.prisma.incident.findMany({
        where: {
          assigneeId: userId,
          ...(normalizedPriority && { priority: normalizedPriority }),
          createdAt: {
            gte: cleanTimeframe.start,
            lte: cleanTimeframe.end,
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

      console.log(
        "======================= Incidents fetched from DB: =======================",
        incidents
      );

      return incidents;
    } catch (error) {
      console.error("Error fetching incidents:", error);
      throw new Error("Failed to fetch incidents");
    }
  };

  private normalizePriorityAndTimeframe(
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

    const { start, end } = this.remapDateRangeToCurrent(timeframe);

    return {
      priority: normalizedPriority,
      timeframe: { start, end },
    };
  }

  private remapDateRangeToCurrent = (range: TimeFrame): TimeFrame => {
    const { start, end } = range;

    const startDate = new Date(start);
    const endDate = new Date(end);

    const baseline = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    );

    const now = new Date();
    const today = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );

    const msPerDay = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    const dayOffset = Math.floor((today - baseline) / msPerDay);

    // Shift dates
    const shiftedStart = new Date(startDate.getTime() + dayOffset * msPerDay);
    const shiftedEnd = new Date(endDate.getTime() + dayOffset * msPerDay);

    return {
      start: shiftedStart,
      end: shiftedEnd,
    };
  };
}
