import { Integration } from './integration.type';
import { mapIntegrationsToResponse } from './integration.util';
import prisma from '../../lib/prisma'
import { Request } from 'express';
import {getUserId} from '../auth/utils'

export class IntegrationService {
  /**
   * Retrieves all available integrations
   * @returns Promise<Integration[]> - Array of available integrations
   */
  static async getSingleIntegrations(req: Request): Promise<Integration[] | any[] | unknown> {
    const id = getUserId(req)
    try {
      // Map the enum values to the response format
      const integrations = await prisma?.userThirdpartyIntegration.findMany({
        where:{userId:id}
      })
 
      
      // Sort integrations alphabetically by name for consistent ordering
      // return integrations.sort((a, b) => a.name.localeCompare(b.name));
      const newIntegration  = integrations.map((data) => {
        return {
          ...data,
          name: data.provider.toUpperCase()
        };
      });
      return newIntegration;
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw new Error('Failed to fetch integrations');
    }
  }






  /**
   * Retrieves all available integrations
   * @returns Promise<Integration[]> - Array of available integrations
   */
  static async getAllIntegrations(): Promise<Integration[]> {
    try {
      // Map the enum values to the response format
      const integrations = mapIntegrationsToResponse();
      
      // Sort integrations alphabetically by name for consistent ordering
      return integrations.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error fetching integrations:', error);
      throw new Error('Failed to fetch integrations');
    }
  }

  /**
   * Validates if integration exists by name
   * @param name - Integration name to validate
   * @returns boolean - Whether integration exists
   */
  static async validateIntegrationExists(name: string): Promise<boolean> {
    try {
      const integrations = await this.getAllIntegrations();
      return integrations.some(integration => 
        integration.name.toLowerCase() === name.toLowerCase()
      );
    } catch (error) {
      console.error('Error validating integration:', error);
      return false;
    }
  }
}