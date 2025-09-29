"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketStatusChangeController = void 0;
const database_1 = require("../../config/database");
class TicketStatusChangeController {
    emailService;
    constructor(emailService) {
        this.emailService = emailService;
    }
    async updateTicketStatus(req, res) {
        try {
            const { ticketId, newStatus } = req.body;
            // Validate input
            if (!ticketId || !newStatus) {
                res.status(400).json({ error: 'Missing required fields: ticketId and newStatus' });
                return;
            }
            // Get current ticket details
            const ticket = await database_1.prisma.incidentTicket.findUnique({
                where: { id: ticketId },
                select: {
                    status: true,
                    reason: true,
                    description: true,
                    assignedToEmail: true
                }
            });
            if (!ticket) {
                res.status(404).json({ error: 'Ticket not found' });
                return;
            }
            const previousStatus = ticket.status;
            const assignee = await database_1.prisma.invites.findUnique({
                where: { email: ticket.assignedToEmail }
            });
            // Prepare data for email
            const emailData = {
                ticketId,
                previousStatus,
                newStatus,
                assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Assignee',
                assigneeEmail: ticket.assignedToEmail,
                ticketTitle: ticket.reason,
                ticketDescription: ticket.description
            };
            // Update ticket status
            await database_1.prisma.incidentTicket.update({
                where: { id: ticketId },
                data: { status: newStatus }
            });
            // Send notification email
            await this.emailService.sendTicketStatusChangeEmail(emailData);
            res.status(200).json({ message: 'Ticket status updated and notification sent' });
        }
        catch (error) {
            res.status(500).json({
                error: 'Failed to update ticket status',
                details: error.message
            });
        }
    }
}
exports.TicketStatusChangeController = TicketStatusChangeController;
