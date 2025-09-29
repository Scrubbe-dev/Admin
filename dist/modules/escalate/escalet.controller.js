"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const escalate_service_1 = require("./escalate.service");
const escalate_utils_1 = require("./escalate.utils");
class TicketController {
    static escalateTicket = (0, escalate_utils_1.catchAsync)(async (req, res) => {
        const { ticketId } = req.params;
        const { escalatedTo, reason } = req.body;
        // We need the user who is performing the escalation. 
        // This would typically come from authentication middleware
        const userId = req.user?.id;
        if (!userId) {
            return (0, escalate_utils_1.sendResponse)(res, 401, 'Authentication required');
        }
        const result = await escalate_service_1.TicketService.escalateTicket(ticketId, escalatedTo, userId, reason);
        (0, escalate_utils_1.sendResponse)(res, 200, 'Ticket escalated successfully', result);
    });
}
exports.TicketController = TicketController;
