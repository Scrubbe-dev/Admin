import { Server, Socket } from "socket.io";
import { ConversationParticipant, PrismaClient } from "@prisma/client";
import { socketAuth } from "./socketAuth";
import { JoinPayload, SendMessagePayload } from "./socket.type";

export const initSocket = (io: Server, prisma: PrismaClient) => {
  io.use(socketAuth);

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id;
    console.log(`User connected: ${userId} (${socket.id})`);

    let participant: ConversationParticipant | null;
    socket.on("joinConversation", async ({ incidentTicketId }: JoinPayload) => {
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
      console.log(
        `User with email ${userId} joined conversation ${incidentTicketId}`
      );
    });

    socket.on(
      "sendMessage",
      async ({ incidentTicketId, content }: SendMessagePayload) => {
        try {
          if (!participant) {
            socket.emit("error", {
              message:
                "Not authorized to join this conversation or send a message",
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
