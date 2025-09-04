import { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiKeyService } from "./apikey.service";
import { AuthenticatedRequest, VerifyApiKeyResponse } from "./apikey.types";
import { AccountType } from "@prisma/client";

const apiKeyService = new ApiKeyService();

export async function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;

  if (!apiKey || typeof apiKey !== "string") {
    return res.status(401).json({
      error: "API key is required",
    });
  }

  const verification = await apiKeyService.verifyApiKey(apiKey);

  if (!verification.isValid) {
    return res.status(401).json({
      error: "Invalid API key",
    });
  }

  if (!verification.isActive) {
    return res.status(403).json({
      error: verification.isExpired
        ? "API key has expired"
        : "API key is inactive",
    });
  }

  // Attach user and scopes to the request for downstream use
  req.user = {
    id: verification.userId!,
    sub: "",
    firstName: "",
    lastName: "",
    email: "",
    accountType: AccountType.DEVELOPER,
    businessId: "" ,
    scopes: []
  };


  next();
}

export function requireScopes(
  requiredScopes: string[]
): RequestHandler | void | unknown {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const hasAllScopes = requiredScopes.some((scope) =>
      req.user.scopes.includes(scope)
    );

    if (!hasAllScopes) {
      return res.status(403).json({
        error: `Insufficient permissions. Required scopes: ${requiredScopes.join(
          ", "
        )}`,
      });
    }

    return next();
  };
}
