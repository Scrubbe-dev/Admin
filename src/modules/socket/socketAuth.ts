import { Socket } from "socket.io";
import { TokenService } from "../auth/services/token.service";

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15
);

export const socketAuth = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const token =
      socket.handshake.auth?.token ||
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
  } catch (err) {
    next(new Error("Authentication failed"));
  }
};
