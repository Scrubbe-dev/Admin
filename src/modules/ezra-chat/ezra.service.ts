import { PrismaClient } from "@prisma/client";
import { EzraUtils } from "./ezra.utils";
import { askEzra, askEzraStream } from "./askezra";
import { SummariesResponse, TimeFrame } from "./ezra.types";

export class EzraService {
  constructor(
    private prisma: PrismaClient,
    private ezraUtils: EzraUtils = new EzraUtils(prisma)
  ) {}

  async createRuleFromPrompt(prompt: string) {}

  async summarizeIncidents(
    priority: string | null,
    timeframe: TimeFrame,
    userId: string,
    prompt: string
  ) {
    const incidents = await this.ezraUtils.fetchIncidentsbyId(
      userId,
      priority,
      timeframe
    );

    const streamSummary = await askEzraStream("summarizeIncidents", prompt, {
      incidents,
    });

    return streamSummary;
  }
}
