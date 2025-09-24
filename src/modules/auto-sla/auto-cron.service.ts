import cron from 'node-cron';
import { SLAService } from './auto-slarules.services';
import prisma from '../../lib/prisma';

export class SLACronService {
  private slaService: SLAService;
  private isRunning: boolean = false;

  constructor() {
    this.slaService = new SLAService();
    this.initializeCronJobs();
  }

  private initializeCronJobs(): void {
    // Run every 2 minutes to check for new incidents and initialize SLA
    cron.schedule('*/2 * * * *', async () => {
      await this.initializeNewIncidents();
    });

    // Run every 5 minutes to check SLA milestones
    cron.schedule('*/5 * * * *', async () => {
      await this.runSLAChecks();
    });

    // Run every hour for comprehensive audit
    cron.schedule('0 * * * *', async () => {
      await this.runSLAAudit();
    });

    console.log('Automatic SLA Cron jobs initialized');
  }

  private async initializeNewIncidents(): Promise<void> {
    try {
      console.log('Scanning for new incidents without SLA...');
      
      const initializedCount = await this.slaService.initializeSLAForNewIncidents();
      
      if (initializedCount > 0) {
        console.log(`Initialized SLA for ${initializedCount} new incidents`);
      }
      
    } catch (error) {
      console.error('Error initializing SLA for new incidents:', error);
    }
  }

  private async runSLAChecks(): Promise<void> {
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
      } else {
        console.log('No SLA breaches found');
      }
      
    } catch (error) {
      console.error('Error running SLA checks:', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async runSLAAudit(): Promise<void> {
    try {
      console.log('Running SLA audit...');
      
      // Check for incidents that might have missed notifications
      const now = new Date();
      const problematicIncidents = await prisma.incidentTicket.findMany({
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
      
    } catch (error) {
      console.error('Error running SLA audit:', error);
    }
  }

  // Manual trigger for testing
  async manualSLACheck(): Promise<any> {
    const initialized = await this.initializeNewIncidents();
    const breaches = await this.runSLAChecks();
    return { initialized, breaches };
  }

  // Stop all cron jobs (for testing/cleanup)
  stop(): void {
    console.log('Automatic SLA monitoring stopped');
  }
}