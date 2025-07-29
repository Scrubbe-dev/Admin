import { FingerprintConfigRequest } from "./fingerprint.types";
import prisma from "../../config/database";
import { PackageModule } from "@prisma/client";

export class FingerprintService {
  constructor() {}
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
          enviroment: request.enviroment,
          domain: request.domain,
          description: request.description,
        },
        create: {
          ownerId: userId,
          package: PackageModule.FINGERPRINT,
          name: request.name,
          enviroment: request.enviroment,
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
