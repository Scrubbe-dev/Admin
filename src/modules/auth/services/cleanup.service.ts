// Create a new file: services/cleanup.service.ts

import { PrismaClient } from "@prisma/client";

export class CleanupService {
  constructor(private prisma: PrismaClient) {}

  async cleanupExpiredTokens(): Promise<void> {
    try {
      const result = await this.prisma.resetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { usedAt: { not: null } }
          ]
        }
      });
      
      console.log(`Cleaned up ${result.count} expired/used reset tokens`);
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }
}