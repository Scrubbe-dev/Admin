import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  VerifyEmailRequest,
  ResendOtpRequest,
} from "../types/auth.types";
import { validateRequest } from "../utils/validators";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyOTPSchema,
} from "../schemas/auth.schema";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const input = await validateRequest<RegisterInput>(registerSchema, req.body);
      const input = req.body;
      console.log(input);
      const result = await this.authService.register(input);
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
      next(error)
    }
  };

  login = async (req: Request, res: Response) => {
    const input = await validateRequest<LoginInput>(loginSchema, req.body);
    const result = await this.authService.login(input);
    res.json(result);
  };

  refreshTokens = async (req: Request, res: Response) => {
    const input = await validateRequest<RefreshTokenInput>(
      refreshTokenSchema,
      req.body
    );
    const tokens = await this.authService.refreshTokens(input.refreshToken);
    res.json(tokens);
  };

  logout = async (req: Request, res: Response) => {
    const { refreshToken } = await validateRequest<RefreshTokenInput>(
      refreshTokenSchema,
      req.body
    );
    await this.authService.logout(refreshToken);
    res.status(204).send();
  };

  me = async (req: Request, res: Response) => {
    res.json(req.user);
  };
}
