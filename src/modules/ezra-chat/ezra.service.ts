import { PrismaClient } from "@prisma/client";
import { EzraUtils } from "./ezra.utils";
import { askEzra } from "./askezra";
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
    console.log(
      "summarizeincidents called, priority, timeframe, userId. prompt:"
    );
    console.log(priority, timeframe, userId, prompt);

    const incidents = await this.ezraUtils.fetchIncidentsbyId(
      userId,
      priority,
      timeframe
    );

    console.log(
      "======================= Incidents fetched: =======================",
      incidents
    );

    const summary = await askEzra<SummariesResponse>("summarizeIncidents", prompt, {
      incidents,
    });

    return summary;
  }
}
