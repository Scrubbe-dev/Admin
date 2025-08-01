import { PrismaClient } from "@prisma/client";
import { EzraUtils } from "./ezra.utils";
import { askEzraStream } from "./askezra";
import { IncidentFetched, SummarizePromptResponse } from "./ezra.types";
import {
  getIncidentsConversation,
  setIncidentConversations,
} from "./conversation-store";

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
    let incidents: IncidentFetched[] = [];

    if (
      ezraResponse.wantsAction &&
      ezraResponse.timeframe.start &&
      ezraResponse.timeframe.end
    ) {
      const fetchedIncidents = await this.ezraUtils.fetchIncidentsbyId(
        userId,
        ezraResponse.priority,
        ezraResponse.timeframe,
        ezraResponse.searchTerms
      );

      incidents = fetchedIncidents.map((incident, idx) => ({
        ...incident,
        number: idx + 1,
      }));

      if (incidents?.length) {
        const numberedIncidents = incidents.map((incident, idx) => ({
          ...incident,
          number: idx + 1,
        }));

        setIncidentConversations(userId, numberedIncidents);
        incidents = numberedIncidents;
        console.log("========== Mapped Incidents ==========", incidents)
      }
    } else {
      // if no new fetch, reuse store conversation for follow up reference
      incidents = getIncidentsConversation(userId);
    }

    const streamSummary = await askEzraStream(
      "summarizeIncidents",
      prompt,
      {
        incidents,
      },
      userId
    );

    return streamSummary;
  }
}
