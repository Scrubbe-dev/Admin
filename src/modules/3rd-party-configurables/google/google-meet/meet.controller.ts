import { NextFunction, Request, Response } from "express";
import { MeetService } from "./meet.service";

export class MeetController {
  constructor(private meetService: MeetService) {}

  async connectMeet(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub!;
      // const { userId } = req.params; // TODO: REPLACE THIS WITH MIDDLEWARE AFTER TESTING

      const response = await this.meetService.connectMeet(userId);

      res.redirect(response);
    } catch (error) {
      next(error);
    }
  }

  async handleOAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state: userId } = req.query;

      const response = await this.meetService.handleOAuthCallback(
        code as string,
        userId as string
      );

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
}
