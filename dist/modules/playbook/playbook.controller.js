"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaybookController = void 0;
const playbook_service_1 = require("./playbook.service");
const playbook_util_1 = require("./playbook.util");
class PlaybookController {
    /**
     * Get recommended playbooks for a ticket
     * @route POST /api/tickets/playbooks/{ticketId}
     * @param {string} ticketId.path.required - ID of the ticket
     * @returns {RecommendedPlaybooksResponse} 200 - Recommended playbooks
     * @returns {object} 404 - Ticket not found
     * @returns {object} 500 - Internal server error
     */
    static getRecommendedPlaybooks = (0, playbook_util_1.catchAsync)(async (req, res) => {
        const { ticketId } = req.params;
        const { generate } = req.query; // Optional query parameter to generate new recommendations
        let result;
        if (generate === 'true') {
            result = await playbook_service_1.PlaybookService.generatePlaybookRecommendations(ticketId);
        }
        else {
            result = await playbook_service_1.PlaybookService.getRecommendedPlaybooks(ticketId);
        }
        (0, playbook_util_1.sendResponse)(res, 200, 'Recommended playbooks retrieved successfully', result);
    });
}
exports.PlaybookController = PlaybookController;
