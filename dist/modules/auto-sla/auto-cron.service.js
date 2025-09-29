"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLACronService = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const auto_slarules_services_1 = require("./auto-slarules.services");
const prisma_1 = __importDefault(require("../../lib/prisma"));
class SLACronService {
    slaService;
    isRunning = false;
    constructor() {
        this.slaService = new auto_slarules_services_1.SLAService();
        this.initializeCronJobs();
    }
    initializeCronJobs() {
        // Run every 2 minutes to check for new incidents and initialize SLA
        node_cron_1.default.schedule('*/2 * * * *', async () => {
            await this.initializeNewIncidents();
        });
        // Run every 5 minutes to check SLA milestones
        node_cron_1.default.schedule('*/5 * * * *', async () => {
            await this.runSLAChecks();
        });
        // Run every hour for comprehensive audit
        node_cron_1.default.schedule('0 * * * *', async () => {
            await this.runSLAAudit();
        });
        console.log('Automatic SLA Cron jobs initialized');
    }
    async runSLAChecks() {
        if (this.isRunning) {
            console.log('SLA check already running, skipping...');
            return;
        }
        try {
            this.isRunning = true;
            console.log('Starting automatic SLA checks...');
            const breaches = await this.slaService.checkSLABreaches();
            if (breaches.length > 0) {
                console.log(`Found ${breaches.length} SLA breaches`);
            }
            else {
                console.log('No SLA breaches found');
            }
        }
        catch (error) {
            console.error('Error running SLA checks:', error);
            // Don't re-throw to prevent cron job from stopping
        }
        finally {
            this.isRunning = false;
        }
    }
    async initializeNewIncidents() {
        try {
            console.log('Scanning for new incidents without SLA...');
            const initializedCount = await this.slaService.initializeSLAForNewIncidents();
            if (initializedCount > 0) {
                console.log(`Initialized SLA for ${initializedCount} new incidents`);
            }
        }
        catch (error) {
            console.error('Error initializing SLA for new incidents:', error);
        }
    }
    //   private async runSLAChecks(): Promise<void> {
    //     if (this.isRunning) {
    //       console.log('SLA check already running, skipping...');
    //       return;
    //     }
    //     try {
    //       this.isRunning = true;
    //       console.log('Starting automatic SLA checks...');
    //       const breaches = await this.slaService.checkSLABreaches();
    //       if (breaches.length > 0) {
    //         console.log(`Found ${breaches.length} SLA breaches`);
    //       } else {
    //         console.log('No SLA breaches found');
    //       }
    //     } catch (error) {
    //       console.error('Error running SLA checks:', error);
    //     } finally {
    //       this.isRunning = false;
    //     }
    //   }
    async runSLAAudit() {
        try {
            console.log('Running SLA audit...');
            // Check for incidents that might have missed notifications
            const now = new Date();
            const problematicIncidents = await prisma_1.default.incidentTicket.findMany({
                where: {
                    status: { in: ['OPEN', 'IN_PROGRESS', 'ACKNOWLEDGED', 'INVESTIGATION'] },
                    OR: [
                        {
                            slaTargetAck: { lt: now },
                            slaResponseBreachNotified: false,
                            firstAcknowledgedAt: null
                        },
                        {
                            slaTargetResolve: { lt: now },
                            slaResolveBreachNotified: false,
                            resolvedAt: null
                        }
                    ]
                }
            });
            if (problematicIncidents.length > 0) {
                console.log(`Found ${problematicIncidents.length} incidents with potential notification issues`);
                // Force re-check these incidents
                await this.slaService.checkSLABreaches();
            }
        }
        catch (error) {
            console.error('Error running SLA audit:', error);
        }
    }
    // Manual trigger for testing
    async manualSLACheck() {
        const initialized = await this.initializeNewIncidents();
        const breaches = await this.runSLAChecks();
        return { initialized, breaches };
    }
    // Stop all cron jobs (for testing/cleanup)
    stop() {
        console.log('Automatic SLA monitoring stopped');
    }
}
exports.SLACronService = SLACronService;
