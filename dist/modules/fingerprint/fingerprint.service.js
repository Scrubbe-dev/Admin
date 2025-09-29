"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FingerprintService = void 0;
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
const error_1 = require("../auth/error");
class FingerprintService {
    constructor() { }
    async getUserFingerprintConfig(userId) {
        try {
            const fingerprintConfig = await database_1.prisma.projectConfiguration.findFirst({
                where: {
                    ownerId: userId,
                    package: client_1.PackageModule.FINGERPRINT,
                },
            });
            if (!fingerprintConfig) {
                throw new error_1.NotFoundError("No configured fingerprint found for this user");
            }
            return {
                id: fingerprintConfig.id,
                name: fingerprintConfig.name,
                enviroment: fingerprintConfig.enviroment,
                domain: fingerprintConfig.domain,
                description: fingerprintConfig.description,
                modules: fingerprintConfig.modules,
                package: fingerprintConfig.package,
                lastseen: fingerprintConfig.lastseen,
            };
        }
        catch (error) {
            console.error(`Error fetching fingerprint configuration: ${error}`);
            throw new error_1.AppError(`Error fetching fingerprint configuration: ${error instanceof Error && error.message}`);
        }
    }
    async fingerprintConfiguration(request, userId) {
        try {
            const savedConfig = await database_1.prisma.projectConfiguration.upsert({
                where: {
                    ownerId_package: {
                        ownerId: userId,
                        package: client_1.PackageModule.FINGERPRINT,
                    },
                },
                update: {
                    name: request.name,
                    enviroment: request.environment,
                    domain: request.domain,
                    description: request.description,
                },
                create: {
                    ownerId: userId,
                    package: client_1.PackageModule.FINGERPRINT,
                    name: request.name,
                    enviroment: request.environment,
                    domain: request.domain,
                    description: request.description,
                },
            });
            return {
                id: savedConfig.id,
                name: savedConfig.name,
                enviroment: savedConfig.enviroment,
                domain: savedConfig.domain,
                description: savedConfig.description,
                modules: savedConfig.modules,
                package: savedConfig.package,
                lastseen: savedConfig.lastseen,
            };
        }
        catch (error) {
            console.error("Error saving fingerprint configuration:", error);
            throw new Error("Failed to save fingerprint configuration");
        }
    }
}
exports.FingerprintService = FingerprintService;
