import { PrismaClient } from "@prisma/client";
// import prisma from "../../prisma-clients/client";
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
    const ticketId = ezraResponse.incidentTicketId;

    if (ticketId && EzraUtils.hasValidIncidentTicketId(ticketId)) {
      const incidentTicket = await this.prisma.incidentTicket.findUnique({
        where: { ticketId },
      });

      const acceptableType = incidentTicket ? incidentTicket : undefined;

      const stream = await askEzraStream(
        "summarizeIncidents",
        prompt,
        acceptableType,
        userId
      );

      return stream;
    }

    let incidents: IncidentFetched[] = [];

    if (EzraUtils.shouldStreamSummary(ezraResponse)) {
      const fetchedIncidents = await this.ezraUtils.fetchIncidentsById(
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
        console.log("========== Mapped Incidents ==========", incidents);
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
