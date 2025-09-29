"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketAuth = void 0;
const token_service_1 = require("../auth/services/token.service");
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15);
const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token ||
            socket.handshake.headers.authorization?.split(" ")[1];
        if (!token) {
            return next(new Error("Authentication token missing"));
        }
        const payload = await tokenService.verifyAccessToken(token);
        if (!payload) {
            return next(new Error("Invalid or expired token"));
        }
        socket.data.user = { id: payload.sub, email: payload.email };
        next();
    }
    catch (err) {
        console.error("Socket auth failed", err);
        next(new Error("Authentication failed"));
    }
};
exports.socketAuth = socketAuth;
