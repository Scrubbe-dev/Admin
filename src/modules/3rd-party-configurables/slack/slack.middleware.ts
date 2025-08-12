import crypto from "crypto";
import qs from "qs";
import { Request, Response, NextFunction } from "express";
import slackConfig from "../../../config/slack.config";
import { UnauthorizedError } from "../../auth/error";

export function verifySlackSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const timestamp = req.headers["x-slack-request-timestamp"] as string;
    const sigBaseString = `v0:${timestamp}:${qs.stringify(req.body, {
      format: "RFC1738",
    })}`;

    const mySignature = `v0=${crypto
      .createHmac("sha256", slackConfig.signingSecret)
      .update(sigBaseString, "utf8")
      .digest("hex")}`;

    const slackSignature = req.headers["x-slack-signature"];

    if (
      !slackSignature ||
      !crypto.timingSafeEqual(
        Buffer.from(mySignature),
        Buffer.from(slackSignature as string)
      )
    ) {
      throw new UnauthorizedError("Invalid Slack signature");
    }
    next();
  } catch (error) {
    next(error);
  }
}
