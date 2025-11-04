"use strict";
// import { Server } from "socket.io";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocketGlobally = void 0;
// let io: Server | null = null;
// export const initSocketGloblly = (server: any) => {
//   io = new Server(server, {
//     path: "/api/v1/incident-ticket/conversation",
//     cors: {
//       origin: "*",
//     },
//   });
//   return io;
// };
// export const getIO = (): Server => {
//   if (!io) {
//     throw new Error("Socket.io not initialized");
//   }
//   return io;
// };
// import { Server } from "socket.io";
// let io: Server | null = null;
// export const initSocketGlobally = (server: any) => {
//   if (io) {
//     return io; // Return existing instance if already initialized
//   }
//   io = new Server(server, {
//     path: "/api/v1/incident-ticket/conversation", // Standard path
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"]
//     },
//     transports: ["websocket", "polling"] // Ensure multiple transport methods
//   });
//   console.log("✅ Global Socket.io server initialized");
//   return io;
// };
// export const getIO = (): Server => {
//   if (!io) {
//     throw new Error("Socket.io not initialized. Call initSocketGlobally first.");
//   }
//   return io;
// };
const socket_io_1 = require("socket.io");
let io = null;
const initSocketGlobally = (server) => {
    if (io) {
        return io;
    }
    io = new socket_io_1.Server(server, {
        path: "/socket.io", // Use standard path
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ["websocket", "polling"]
    });
    console.log("✅ Global Socket.io server initialized");
    return io;
};
exports.initSocketGlobally = initSocketGlobally;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized. Call initSocketGlobally first.");
    }
    return io;
};
exports.getIO = getIO;
