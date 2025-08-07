import { Server } from "socket.io";

let io: Server | null = null;

export const initSocketGloblly = (server: any) => {
  io = new Server(server, {
    path: "/api/v1/incident-ticket/conversation",
    cors: {
      origin: "*",
    },
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
