"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetController = void 0;
class MeetController {
    meetService;
    constructor(meetService) {
        this.meetService = meetService;
    }
    async connectMeet(req, res, next) {
        try {
            const userId = req.user?.sub;
            const response = await this.meetService.connectMeet(userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async handleOAuthCallback(req, res, next) {
        try {
            const { code, state: userId } = req.query;
            const response = await this.meetService.handleOAuthCallback(code, userId);
            res.json(response);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.MeetController = MeetController;
