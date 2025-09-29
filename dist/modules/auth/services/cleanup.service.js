"use strict";
// Create a new file: services/cleanup.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanupService = void 0;
class CleanupService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async cleanupExpiredTokens() {
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
        }
        catch (error) {
            console.error("Error cleaning up expired tokens:", error);
        }
    }
}
exports.CleanupService = CleanupService;
