import { PackageModule } from "@prisma/client";

export interface FingerprintConfigRequest {
  name: string;
  environment: string;
  domain?: string;
  description?: string;
  package: PackageModule;
}

export interface FingerprintConfigResponse {
  id: string;
  name: string;
  enviroment: string;
  domain: string | null;
  description: string | null;
  modules: string[];
  package: PackageModule;
  lastseen: Date;
}
