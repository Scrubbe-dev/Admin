import {
  Incident,
  IncidentTicket,
  Priority,
  PrismaClient,
} from "@prisma/client";
import {
  ExpressResponse,
  MappedIncidents,
  RiskScore,
  SummarizePromptResponse,
  TimeFrame,
} from "./ezra.types";
import { askEzra } from "./askezra";

export class EzraUtils {
  constructor(private prisma = new PrismaClient()) {}
  fetchIncidentsById = async (
    userId: string,
    priority: string | null,
    timeframe: TimeFrame,
    searchTerm: string[]
  ) => {
    try {
      const normalized = await this.normalizePriorityAndTimeframe(
        priority,
        timeframe
      );

      console.log(
        "================ normalized ================",
        normalized.priority,
        normalized.timeframe
      );

      const incidents = await this.prisma.incident.findMany({
        where: {
          assigneeId: userId,
          ...(normalized.priority && { priority: normalized.priority }),
          createdAt: {
            gte: normalized.timeframe.start,
            lte: normalized.timeframe.end,
          },
          ...(searchTerm.length > 0 && {
            OR: searchTerm.map((term) => ({
              OR: [
                { title: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
              ],
            })),
          }),
        },
        select: {
          id: true,
          title: true,
          description: true,
          priority: true,
          // status: true,
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

    newStart.setUTCHours(
      startDate.getUTCHours(),
      startDate.getUTCMinutes(),
      startDate.getUTCSeconds(),
      startDate.getUTCMilliseconds()
    );

    newEnd.setUTCHours(
      endDate.getUTCHours(),
      endDate.getUTCMinutes(),
      endDate.getUTCSeconds(),
      endDate.getUTCMilliseconds()
    );

    return { start: newStart, end: newEnd };
  };

  static pipeStream(streamResponse: Response, res: ExpressResponse) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("X-Accel-Buffering", "no");

    const reader = streamResponse.body?.getReader();
    const decoder = new TextDecoder();

    let reply = ""; // not necessary, only for logging
    (async () => {
      while (true) {
        const result = await reader?.read();
        if (!result) break;
        const { value, done } = result;
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        reply += chunk;
        res.write(chunk);
      }

      console.log("Stream Response:", reply);

      res.end();
    })();
  }

  static hasValidIncidentTicketId(ticketId: string | null): boolean {
    return (ticketId && ticketId !== "null") || ticketId !== null;
  }

  static shouldStreamSummary(ezraRes: SummarizePromptResponse): boolean {
    return (
      ezraRes.wantsAction &&
      ezraRes.timeframe.start &&
      ezraRes.timeframe.end != null
    );
  }

  static async determineRiskScore(incidentTicket: IncidentTicket) {
    return await askEzra<RiskScore>(
      "determineRiskScore",
      "determine risk score based off this incident",
      incidentTicket
    );
  }

  static mapIncidents(incident: Incident): MappedIncidents {
    return {
      createdAt: incident.createdAt,
      id: incident.id,
      description: incident.description,
      title: incident.title,
      priority: incident.priority,
    };
  }
}
