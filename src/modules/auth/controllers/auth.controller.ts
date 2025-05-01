import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from '../types/auth.types';
import { validateRequest } from '../utils/validators';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/auth.schema';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    // const input = await validateRequest<RegisterInput>(registerSchema, req.body);
    const input = req.body;
    const result = await this.authService.register(input);
    res.status(201).json(result);
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