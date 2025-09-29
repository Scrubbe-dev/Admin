"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EzraService = void 0;
// import prisma from "../../prisma-clients/client";
const ezra_utils_1 = require("./ezra.utils");
const askezra_1 = require("./askezra");
const conversation_store_1 = require("./conversation-store");
class EzraService {
    prisma;
    ezraUtils;
    constructor(prisma, ezraUtils = new ezra_utils_1.EzraUtils(prisma)) {
        this.prisma = prisma;
        this.ezraUtils = ezraUtils;
    }
    async createRuleFromPrompt(prompt) { }
    async summarizeIncidents(ezraResponse, userId, prompt) {
        const ticketId = ezraResponse.incidentTicketId;
        if (ticketId && ezra_utils_1.EzraUtils.hasValidIncidentTicketId(ticketId)) {
            const incidentTicket = await this.prisma.incidentTicket.findUnique({
                where: { ticketId },
            });
            const acceptableType = incidentTicket ? incidentTicket : undefined;
            const stream = await (0, askezra_1.askEzraStream)("summarizeIncidents", prompt, acceptableType, userId);
            return stream;
        }
        let incidents = [];
        if (ezra_utils_1.EzraUtils.shouldStreamSummary(ezraResponse)) {
            const fetchedIncidents = await this.ezraUtils.fetchIncidentsById(userId, ezraResponse.priority, ezraResponse.timeframe, ezraResponse.searchTerms);
            incidents = fetchedIncidents.map((incident, idx) => ({
                ...incident,
                number: idx + 1,
            }));
            if (incidents?.length) {
                const numberedIncidents = incidents.map((incident, idx) => ({
                    ...incident,
                    number: idx + 1,
                }));
                (0, conversation_store_1.setIncidentConversations)(userId, numberedIncidents);
                incidents = numberedIncidents;
                console.log("========== Mapped Incidents ==========", incidents);
            }
        }
        else {
            // if no new fetch, reuse store conversation for follow up reference
            incidents = (0, conversation_store_1.getIncidentsConversation)(userId);
        }
        const streamSummary = await (0, askezra_1.askEzraStream)("summarizeIncidents", prompt, {
            incidents,
        }, userId);
        return streamSummary;
    }
    async visualGraph(ezraResponse, prompt, userId) {
        try {
            console.log("=========== ezraResponse ===========", ezraResponse);
            const incidents = await this.ezraUtils.fetchIncidentsById(userId, ezraResponse.priority, ezraResponse.timeframe, ezraResponse.searchTerms);
            console.log("=========== incidents fetched ===========", incidents);
            const graph = await (0, askezra_1.askEzra)("visualGraph", JSON.stringify(incidents), incidents);
            console.log("=========== Graph response ===========", JSON.stringify(graph));
            return graph;
        }
        catch (error) {
            throw new Error("Failed to fetch graphs");
        }
    }
}
exports.EzraService = EzraService;
