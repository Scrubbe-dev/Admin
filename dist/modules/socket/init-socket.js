"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocketGloblly = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocketGloblly = (server) => {
    io = new socket_io_1.Server(server, {
        path: "/api/v1/incident-ticket/conversation",
        cors: {
            origin: "*",
        },
    });
    return io;
};
exports.initSocketGloblly = initSocketGloblly;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};
exports.getIO = getIO;
