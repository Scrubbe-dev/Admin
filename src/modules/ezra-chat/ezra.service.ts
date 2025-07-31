import { PrismaClient } from "@prisma/client";
import { EzraUtils } from "./ezra.utils";
import { askEzraStream } from "./askezra";
import { SummarizePromptResponse } from "./ezra.types";

export class EzraService {
  constructor(
    private prisma: PrismaClient,
    private ezraUtils: EzraUtils = new EzraUtils(prisma)
  ) {}

  async createRuleFromPrompt(prompt: string) {}

  async summarizeIncidents(
    ezraResponse: SummarizePromptResponse,
    userId: string,
    prompt: string
  ) {
    let incidents;

    if (
      ezraResponse.wantsAction &&
      ezraResponse.timeframe.start &&
      ezraResponse.timeframe.end
    ) {
      incidents = await this.ezraUtils.fetchIncidentsbyId(
        userId,
        ezraResponse.priority,
        ezraResponse.timeframe,
        ezraResponse.searchTerms
      );
    }

    const streamSummary = await askEzraStream(
      "summarizeIncidents",
      prompt,
      {
        incidents,
      },
      userId,
      ezraResponse.confirmSuggestion
    );

    return streamSummary;
  }
}
