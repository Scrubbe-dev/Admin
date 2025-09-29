"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLAController = void 0;
const auto_slarules_services_1 = require("./auto-slarules.services");
const auto_slarules_utils_1 = require("./auto-slarules.utils");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const auto_cron_service_1 = require("./auto-cron.service");
const slaService = new auto_slarules_services_1.SLAService();
const slaCronService = new auto_cron_service_1.SLACronService();
class SLAController {
    async triggerAutomaticSLA(req, res) {
        try {
            const result = await slaCronService.manualSLACheck();
            res.status(200).json({
                message: 'Automatic SLA check triggered manually',
                success: true,
                result
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Failed to trigger automatic SLA check',
                error: error.message
            });
        }
    }
    async initializeSLA(req, res) {
        try {
            const { incidentId, severity } = req.body;
            if (!incidentId || !severity) {
                res.status(400).json({
                    message: 'Incident ID and severity are required',
                    success: false
                });
                return;
            }
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
                where: { id: incidentId },
                include: {
                    createdBy: true,
                    assignedTo: true,
                    assignedBy: true
                }
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
            // Calculate time percentages
            const responseProgress = incident.slaTargetAck ?
                Math.min(100, Math.max(0, ((now.getTime() - incident.createdAt.getTime()) /
                    (incident.slaTargetAck.getTime() - incident.createdAt.getTime())) * 100)) : 0;
            const resolutionProgress = incident.slaTargetResolve ?
                Math.min(100, Math.max(0, ((now.getTime() - incident.createdAt.getTime()) /
                    (incident.slaTargetResolve.getTime() - incident.createdAt.getTime())) * 100)) : 0;
            // MTTR status calculations
            const mttrResponseStatus = incident.firstAcknowledgedAt ? 'met' :
                incident.mttrTargetAck && incident.mttrTargetAck < now ? 'breached' : 'pending';
            const mttrResolutionStatus = incident.resolvedAt ? 'met' :
                incident.mttrTargetResolve && incident.mttrTargetResolve < now ? 'breached' : 'pending';
            const mttrResponseProgress = incident.mttrTargetAck ?
                Math.min(100, Math.max(0, ((now.getTime() - incident.createdAt.getTime()) /
                    (incident.mttrTargetAck.getTime() - incident.createdAt.getTime())) * 100)) : 0;
            const mttrResolutionProgress = incident.mttrTargetResolve ?
                Math.min(100, Math.max(0, ((now.getTime() - incident.createdAt.getTime()) /
                    (incident.mttrTargetResolve.getTime() - incident.createdAt.getTime())) * 100)) : 0;
            res.status(200).json({
                incidentId,
                response: {
                    deadline: incident.slaTargetAck?.toISOString(),
                    status: responseStatus,
                    timeLeft: (0, auto_slarules_utils_1.formatTimeRemaining)(incident.slaTargetAck),
                    progress: Math.round(responseProgress),
                    halfTimeNotified: incident.slaResponseHalfNotified,
                    breachNotified: incident.slaResponseBreachNotified
                },
                resolution: {
                    deadline: incident.slaTargetResolve?.toISOString(),
                    status: resolutionStatus,
                    timeLeft: (0, auto_slarules_utils_1.formatTimeRemaining)(incident.slaTargetResolve),
                    progress: Math.round(resolutionProgress),
                    halfTimeNotified: incident.slaResolveHalfNotified,
                    breachNotified: incident.slaResolveBreachNotified
                },
                mttrResponse: {
                    deadline: incident.mttrTargetAck?.toISOString(),
                    status: mttrResponseStatus,
                    timeLeft: (0, auto_slarules_utils_1.formatTimeRemaining)(incident.mttrTargetAck),
                    progress: Math.round(mttrResponseProgress),
                    halfTimeNotified: incident.mttrResponseHalfNotified,
                    breachNotified: incident.mttrResponseBreachNotified
                },
                mttrResolution: {
                    deadline: incident.mttrTargetResolve?.toISOString(),
                    status: mttrResolutionStatus,
                    timeLeft: (0, auto_slarules_utils_1.formatTimeRemaining)(incident.mttrTargetResolve),
                    progress: Math.round(mttrResolutionProgress),
                    halfTimeNotified: incident.mttrResolveHalfNotified,
                    breachNotified: incident.mttrResolveBreachNotified
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
    // Manual trigger for cron job (for testing)
    async triggerSLACheck(req, res) {
        try {
            const result = await slaCronService.manualSLACheck();
            res.status(200).json({
                message: 'SLA check triggered manually',
                success: true,
                result
            });
        }
        catch (error) {
            res.status(500).json({
                message: 'Failed to trigger SLA check',
                error: error.message
            });
        }
    }
}
exports.SLAController = SLAController;
