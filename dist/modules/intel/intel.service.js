"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
const intel_utils_1 = require("./intel.utils");
const client_1 = __importDefault(require("../../prisma-clients/client"));
class TicketService {
    static async getTicketIntel(ticketId) {
        // Check if ticket exists
        const ticket = await client_1.default.incidentTicket.findUnique({
            where: { id: ticketId },
        });
        if (!ticket) {
            throw new intel_utils_1.AppError('Ticket not found', 404);
        }
        // Get all intel for this ticket
        const intelList = await client_1.default.intel.findMany({
            where: { incidentTicketId: ticketId },
        });
        // Transform to response format
        return intelList.map((intel) => ({
            intelType: intel.intelType,
            details: intel.details,
        }));
    }
}
exports.TicketService = TicketService;
