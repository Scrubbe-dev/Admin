"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaybookService = void 0;
// src/services/playbookService.ts
const client_1 = require("@prisma/client");
const playbook_util_1 = require("./playbook.util");
const prisma = new client_1.PrismaClient();
class PlaybookService {
    static async getRecommendedPlaybooks(ticketId) {
        // Find the ticket with its playbook recommendations
        const ticket = await prisma.incidentTicket.findUnique({
            where: { id: ticketId },
            include: {
                playbookRecommendations: {
                    include: {
                        playbook: true
                    }
                }
            }
        });
        if (!ticket) {
            throw new playbook_util_1.AppError('Ticket not found', 404);
        }
        // Transform the recommendations to the response format
        const playbooks = ticket.playbookRecommendations.map(recommendation => ({
            id: recommendation.playbook.id,
            title: recommendation.playbook.title,
            steps: recommendation.playbook.steps, // Assuming steps is stored as an array of strings
            recommended: recommendation.recommended
        }));
        return {
            ticketId: ticket.id,
            playbooks
        };
    }
    static async generatePlaybookRecommendations(ticketId) {
        // Find the ticket
        const ticket = await prisma.incidentTicket.findUnique({
            where: { id: ticketId },
            include: {
                business: true
            }
        });
        if (!ticket) {
            throw new playbook_util_1.AppError('Ticket not found', 404);
        }
        // Get all active playbooks
        const allPlaybooks = await prisma.playbook.findMany({
            where: { isActive: true }
        });
        // Logic to determine recommended playbooks based on ticket attributes
        // This is a simple example - in a real implementation, this would be more sophisticated
        const recommendedPlaybooks = allPlaybooks.filter(playbook => {
            // Example: Recommend playbooks based on ticket category, impact, etc.
            const playbookTags = playbook.tags || [];
            // Simple recommendation logic
            if (ticket.category === 'MALWARE' && playbookTags.includes('malware')) {
                return true;
            }
            if (ticket.impact === 'HIGH' && playbookTags.includes('high-impact')) {
                return true;
            }
            if (ticket.category === 'PHISHING' && playbookTags.includes('phishing')) {
                return true;
            }
            // Default: not recommended
            return false;
        });
        // Create or update recommendations
        for (const playbook of recommendedPlaybooks) {
            await prisma.ticketPlaybookRecommendation.upsert({
                where: {
                    ticketId_playbookId: {
                        ticketId: ticket.id,
                        playbookId: playbook.id
                    }
                },
                update: {
                    recommended: true
                },
                create: {
                    ticketId: ticket.id,
                    playbookId: playbook.id,
                    recommended: true
                }
            });
        }
        // Get the updated recommendations
        return this.getRecommendedPlaybooks(ticketId);
    }
}
exports.PlaybookService = PlaybookService;
