import crypto from "crypto";
import { gitlabConfig } from "../../../config/gitlab.config";
import { BusinessNotificationChannels } from "@prisma/client";
import { NotFoundError } from "../../auth/error";
import prisma from "../../../prisma-clients/client";

export class GitlabUtil {
  constructor() {}

  private key = Buffer.from(gitlabConfig.secretEncKey, "base64");

  encryptSecret(plain: string): string {
    console.log("========= SECRET ENC KEY =========", this.key);
    console.log("========= PLAIN =========", plain);

    const iv = crypto.randomBytes(12); // GCM recommended IV
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key, iv);
    const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);

    const tag = cipher.getAuthTag();
    return [
      iv.toString("base64"),
      tag.toString("base64"),
      enc.toString("base64"),
    ].join(".");
  }

  decryptSecret(blob: string): string {
    console.log("========= BLOB =========", blob);

    const [ivB64, tagB64, dataB64] = blob.split(".");

    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");

    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key, iv);

    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  }

  async getFreshToken(userId: string): Promise<string> {
    const integ = await prisma.userThirdpartyIntegration.findFirst({
      where: { userId, provider: BusinessNotificationChannels.GITLAB },
    });

    if (!integ?.accessToken) throw new NotFoundError("GitLab not connected");

    const token = this.decryptSecret(integ.accessToken);

    return token;
  }
}
