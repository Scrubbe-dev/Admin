import { Server, Socket } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { socketAuth } from "./socketAuth";
import { JoinPayload, SendMessagePayload } from "./socket.type";

export const initSocket = (io: Server, prisma: PrismaClient) => {
  io.use(socketAuth);

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id;
    console.log(`User connected: ${userId} (${socket.id})`);

    socket.on("joinConversation", async ({ conversationId }: JoinPayload) => {
      const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId },
      });

      if (!participant) {
        socket.emit("error", {
          message: "Not authorized to join this conversation",
        });
        return;
      }

      socket.join(conversationId);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on(
      "sendMessage",
      async ({ conversationId, content }: SendMessagePayload) => {
        try {
          const message = await prisma.message.create({
            data: { conversationId, senderId: userId, content },
            include: { sender: true },
          });

          io.to(conversationId).emit("newMessage", message);
        } catch (error) {
          console.error(error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId} (${socket.id})`);
    });
  });
};
