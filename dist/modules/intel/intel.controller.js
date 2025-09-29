"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const intel_service_1 = require("./intel.service");
const intel_utils_1 = require("./intel.utils");
class TicketController {
    static getTicketIntel = (0, intel_utils_1.catchAsync)(async (req, res) => {
        const { ticketId } = req.params;
        const intel = await intel_service_1.TicketService.getTicketIntel(ticketId);
        (0, intel_utils_1.sendResponse)(res, 200, 'Intel retrieved successfully', intel);
    });
}
exports.TicketController = TicketController;
