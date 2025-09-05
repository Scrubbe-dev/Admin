import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import {
  LoginInput,
  RefreshTokenInput,
  VerifyEmailRequest,
  ResendOtpRequest,
  RegisterDevRequest,
  RegisterBusinessRequest,
  OAuthRequest,
  OAuthBusinesRequest,
  OAuthLoginRequest,
  ChangePasswordInput,
  ValidateResetTokenInput,
  ResetPasswordInput,
  ForgotPasswordInput,
} from "../types/auth.types";
import { validateRequest } from "../utils/validators";
import {
  loginSchema,
  refreshTokenSchema,
  verifyOTPSchema,
  registerDevSchema,
  registerBusinessSchema,
  registerDevByOauth,
  registerBusinessByOauth,
  loginWithOauthSchema,
  changePasswordSchema,
  validateResetTokenSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from "../schemas/auth.schema";
import { UnauthorizedError } from "../error";

export class AuthController {
  constructor(private authService: AuthService) {}

  registerDev = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await validateRequest<RegisterDevRequest>(
        registerDevSchema,
        req.body
      );

      const result = await this.authService.registerDev(request);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  registerBusiness = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const request = await validateRequest<RegisterBusinessRequest>(
        registerBusinessSchema,
        req.body
      );

      const result = await this.authService.registerBusiness(request);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  registerDevByOauth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const request = await validateRequest<OAuthRequest>(
        registerDevByOauth,
        req.body
      );

      const result = await this.authService.registerDevByOauth(request);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  registerBusinessByOauth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const request = await validateRequest<OAuthBusinesRequest>(
        registerBusinessByOauth,
        req.body
      );

      const result = await this.authService.registerBusinessByOauth(request);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = await validateRequest<VerifyEmailRequest>(
        verifyOTPSchema,
        req.body
      );

      const response = await this.authService.verifyEmail(input);

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  resendOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: ResendOtpRequest = req.body;

      const response = await this.authService.resendOTP(input);

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = await validateRequest<LoginInput>(loginSchema, req.body);

      const result = await this.authService.login(input);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  oAuthLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await validateRequest<OAuthLoginRequest>(
        loginWithOauthSchema,
        req.body
      );

      const result = await this.authService.oAuthLogin(request);

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = await validateRequest<RefreshTokenInput>(
        refreshTokenSchema,
        req.body
      );
      const tokens = await this.authService.refreshTokens(input.refreshToken);
      res.json(tokens);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = await validateRequest<RefreshTokenInput>(
        refreshTokenSchema,
        req.body
      );
      await this.authService.logout(refreshToken);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(req.user);
    } catch (error) {
      next(error);
    }
  };

  // In AuthController class

forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = await validateRequest<ForgotPasswordInput>(
      forgotPasswordSchema,
      req.body
    );
    const result = await this.authService.forgotPassword(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = await validateRequest<ResetPasswordInput>(
      resetPasswordSchema,
      req.body
    );
    const result = await this.authService.resetPassword(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

validateResetToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = await validateRequest<ValidateResetTokenInput>(
      validateResetTokenSchema,
      req.body
    );
    const result = await this.authService.validateResetToken(input);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

  // Add this method to your AuthController class
changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const input = await validateRequest<ChangePasswordInput>(
      changePasswordSchema,
      req.body
    );

    // Get user ID from authenticated request
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }

    // Call service method
    const result = await this.authService.changePassword(userId, input);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};
}
