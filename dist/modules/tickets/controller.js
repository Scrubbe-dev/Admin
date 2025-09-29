"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketController = void 0;
const services_1 = require("./services");
const apiResponse_1 = require("./utils/apiResponse");
class TicketController {
    static async getTicketHistory(req, res) {
        try {
            const { ticketId } = req.params;
            const history = await services_1.TicketService.getTicketHistory(ticketId);
            if (!history) {
                return apiResponse_1.ApiResponse.notFound(res, 'Ticket history not found');
            }
            return apiResponse_1.ApiResponse.success(res, history);
        }
        catch (error) {
            return apiResponse_1.ApiResponse.error(res, 'Failed to fetch ticket history');
        }
    }
    static async getTicketDetail(req, res) {
        try {
            const { ticketId } = req.params;
            const ticket = await services_1.TicketService.getTicketById(ticketId);
            if (!ticket) {
                return apiResponse_1.ApiResponse.notFound(res, 'Ticket not found');
            }
            return apiResponse_1.ApiResponse.success(res, ticket);
        }
        catch (error) {
            return apiResponse_1.ApiResponse.error(res, 'Failed to fetch ticket details');
        }
    }
}
exports.TicketController = TicketController;
