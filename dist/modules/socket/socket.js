"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIO = exports.initSocket = void 0;
const socketAuth_1 = require("./socketAuth");
let _io;
const initSocket = (io, prisma) => {
    io.use(socketAuth_1.socketAuth);
    _io = io;
    console.log("=================== Global Socket.io Initialized ===================");
    io.on("connection", (socket) => {
        const userId = socket.data.user.id;
        console.log(`User connected: ${userId} (${socket.id})`);
        socket.on("joinBusinessRoom", ({ businessId }) => {
            if (!businessId)
                return;
            socket.join(businessId);
            console.log(`Socket ${socket.id} joined business room ${businessId}`);
        });
        let participant;
        socket.on("joinConversation", async ({ incidentTicketId }) => {
            participant = await prisma.conversationParticipant.findFirst({
                where: {
                    conversation: {
                        incidentTicketId,
                    },
                    userId,
                },
            });
            if (!participant) {
                socket.emit("error", {
                    message: "Not authorized to join this conversation",
                });
                return;
            }
            socket.join(incidentTicketId);
            console.log(`User with id ${userId} joined conversation ${participant.conversationId}`);
        });
        socket.on("sendMessage", async ({ incidentTicketId, content }) => {
            try {
                if (!participant) {
                    socket.emit("error", {
                        message: "Not authorized to join this conversation or send a message",
                    });
                    return;
                }
                const conversation = await prisma.conversation.findFirst({
                    where: { incidentTicketId },
                });
                if (!conversation) {
                    socket.emit("error", {
                        message: `Conversation not found with ticket id: ${incidentTicketId}`,
                    });
                    return;
                }
                const message = await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        senderId: userId,
                        content,
                    },
                    include: {
                        sender: true,
                    },
                });
                io.to(incidentTicketId).emit("newMessage", message);
            }
            catch (error) {
                console.error(error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${userId} (${socket.id})`);
        });
    });
};
exports.initSocket = initSocket;
const getSocketIO = () => {
    if (!_io)
        throw new Error("Socket.io not initialized");
    return _io;
};
exports.getSocketIO = getSocketIO;
