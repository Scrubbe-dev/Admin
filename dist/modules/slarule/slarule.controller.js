"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLAController = void 0;
const slarule_services_1 = require("./slarule.services");
const slarule_utils_1 = require("./slarule.utils");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const slaService = new slarule_services_1.SLAService();
class SLAController {
    async initializeSLA(req, res) {
        try {
            const { incidentId, severity } = req.body;
            await slaService.setSLADeadlines(incidentId, severity);
            res.status(200).json({
                message: 'SLA initialized successfully',
                success: true
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Failed to initialize SLA',
                error: error.message
            });
        }
    }
    // Manual SLA breach check
    async checkSLABreaches(req, res) {
        try {
            const breaches = await slaService.checkSLABreaches();
            res.status(200).json({
                message: 'SLA breaches checked',
                breaches,
                count: breaches.length
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Failed to check SLA breaches',
                error: error.message
            });
        }
    }
    // Get SLA status for incident
    async getSLAStatus(req, res) {
        try {
            const { incidentId } = req.params;
            const incident = await prisma_1.default.incidentTicket.findUnique({
                where: { id: incidentId }
            });
            if (!incident) {
                res.status(404).json({ message: 'Incident not found' });
                return;
            }
            const now = new Date();
            const responseStatus = incident.firstAcknowledgedAt ? 'met' :
                incident.slaTargetAck && incident.slaTargetAck < now ? 'breached' : 'pending';
            const resolutionStatus = incident.resolvedAt ? 'met' :
                incident.slaTargetResolve && incident.slaTargetResolve < now ? 'breached' : 'pending';
            res.status(200).json({
                incidentId,
                response: {
                    deadline: incident.slaTargetAck?.toISOString(),
                    status: responseStatus,
                    timeLeft: (0, slarule_utils_1.formatTimeRemaining)(incident.slaTargetAck)
                },
                resolution: {
                    deadline: incident.slaTargetResolve?.toISOString(),
                    status: resolutionStatus,
                    timeLeft: (0, slarule_utils_1.formatTimeRemaining)(incident.slaTargetResolve)
                }
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Failed to get SLA status',
                error: error.message
            });
        }
    }
}
exports.SLAController = SLAController;
