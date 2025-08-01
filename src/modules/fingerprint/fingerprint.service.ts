import { FingerprintConfigRequest } from "./fingerprint.types";
import {prisma} from "../../config/database";
import { PackageModule } from "@prisma/client";
import { AppError, NotFoundError } from "../auth/error";

export class FingerprintService {
  constructor() {}
  async getUserFingerprintConfig(userId: string) {
    try {
      const fingerprintConfig = await prisma.projectConfiguration.findFirst({
        where: {
          ownerId: userId,
          package: PackageModule.FINGERPRINT,
        },
      });

      if (!fingerprintConfig) {
        throw new NotFoundError(
          "No configured fingerprint found for this user"
        );
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
    } catch (error) {
      console.error(`Error fetching fingerprint configuration: ${error}`);
      throw new AppError(
        `Error fetching fingerprint configuration: ${
          error instanceof Error && error.message
        }`
      );
    }
  }

  async fingerprintConfiguration(
    request: FingerprintConfigRequest,
    userId: string
  ) {
    try {
      const savedConfig = await prisma.projectConfiguration.upsert({
        where: {
          ownerId_package: {
            ownerId: userId,
            package: PackageModule.FINGERPRINT,
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
          package: PackageModule.FINGERPRINT,
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
    } catch (error) {
      console.error("Error saving fingerprint configuration:", error);
      throw new Error("Failed to save fingerprint configuration");
    }
  }
}
