// import { Server, Socket } from "socket.io";
// import { ConversationParticipant, PrismaClient } from "@prisma/client";
// import { socketAuth } from "./socketAuth";
// import { JoinPayload, SendMessagePayload } from "./socket.type";

// let _io: Server;

// export const initSocket = (io: Server, prisma: PrismaClient) => {
//   io.use(socketAuth);

//   _io = io;
//   console.log(
//     "=================== Global Socket.io Initialized ==================="
//   );

//   io.on("connection", (socket: Socket) => {
//     const userId = socket.data.user.id;
//     console.log(`User connected: ${userId} (${socket.id})`);

//     socket.on("joinBusinessRoom", ({ businessId }) => {
//       if (!businessId) return;
//       socket.join(businessId);
//       console.log(`Socket ${socket.id} joined business room ${businessId}`);
//     });

//     let participant: ConversationParticipant | null;
//     socket.on("joinConversation", async ({ incidentTicketId }: JoinPayload) => {
//       participant = await prisma.conversationParticipant.findFirst({
//         where: {
//           conversation: {
//             incidentTicketId,
//           },
//           userId,
//         },
//       });

//       if (!participant) {
//         socket.emit("error", {
//           message: "Not authorized to join this conversation",
//         });
//         return;
//       }

//       socket.join(incidentTicketId);
//       console.log(
//         `User with id ${userId} joined conversation ${participant.conversationId}`
//       );
//     });

//     socket.on(
//       "sendMessage",
//       async ({ incidentTicketId, content }: SendMessagePayload) => {
//         try {
//           if (!participant) {
//             socket.emit("error", {
//               message:
//                 "Not authorized to join this conversation or send a message",
//             });
//             return;
//           }

//           const conversation = await prisma.conversation.findFirst({
//             where: { incidentTicketId },
//           });

//           if (!conversation) {
//             socket.emit("error", {
//               message: `Conversation not found with ticket id: ${incidentTicketId}`,
//             });
//             return;
//           }

//           const message = await prisma.message.create({
//             data: {
//               conversationId: conversation.id,
//               senderId: userId,
//               content,
//             },
//             include: {
//               sender: true,
//             },
//           });
//           io.to(incidentTicketId).emit("newMessage", message);
//         } catch (error) {
//           console.error(error);
//           socket.emit("error", { message: "Failed to send message" });
//         }
//       }
//     );

//     socket.on("disconnect", () => {
//       console.log(`User disconnected: ${userId} (${socket.id})`);
//     });
//   });
// };

// export const getSocketIO = () => {
//   if (!_io) throw new Error("Socket.io not initialized");

//   return _io;
// };



import { Server, Socket } from "socket.io";
import { ConversationParticipant, PrismaClient } from "@prisma/client";
import { socketAuth } from "./socketAuth";
import { JoinPayload, SendMessagePayload } from "./socket.type";

let _io: Server;

// Store active participants for each socket
const activeParticipants = new Map<string, ConversationParticipant>();

export const initSocket = (io: Server, prisma: PrismaClient) => {
  // Apply authentication middleware
  io.use(socketAuth);

  _io = io;
  
  console.log("✅ Socket.io handler initialized");

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id;
    console.log(`🔌 User connected: ${userId} (${socket.id})`);

    // Join business room
    socket.on("joinBusinessRoom", ({ businessId }: { businessId: string }) => {
      if (!businessId) {
        socket.emit("error", { message: "Business ID is required" });
        return;
      }
      
      socket.leave(socket.data.currentBusinessRoom); // Leave previous room
      socket.join(businessId);
      socket.data.currentBusinessRoom = businessId;
      
      console.log(`🏢 Socket ${socket.id} joined business room: ${businessId}`);
      socket.emit("joinedBusinessRoom", { businessId });
    });

    // Join conversation
    socket.on("joinConversation", async ({ incidentTicketId }: JoinPayload) => {
      try {
        if (!incidentTicketId) {
          socket.emit("error", { message: "Incident ticket ID is required" });
          return;
        }

        // Leave previous conversation
        if (socket.data.currentConversation) {
          socket.leave(socket.data.currentConversation);
        }

        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversation: {
              incidentTicketId,
            },
            userId,
          },
          include: {
            conversation: true,
          },
        });

        if (!participant) {
          socket.emit("error", {
            message: "Not authorized to join this conversation",
          });
          return;
        }

        // Store participant for this socket
        activeParticipants.set(socket.id, participant);
        
        // Join the conversation room
        socket.join(incidentTicketId);
        socket.data.currentConversation = incidentTicketId;

        console.log(
          `💬 User ${userId} joined conversation ${participant.conversationId} for ticket ${incidentTicketId}`
        );

        socket.emit("joinedConversation", { 
          incidentTicketId,
          conversationId: participant.conversationId 
        });

      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Send message
    socket.on(
      "sendMessage",
      async ({ incidentTicketId, content }: SendMessagePayload) => {
        try {
          if (!incidentTicketId || !content) {
            socket.emit("error", { 
              message: "Incident ticket ID and content are required" 
            });
            return;
          }

          const participant = activeParticipants.get(socket.id);
          
          if (!participant) {
            socket.emit("error", {
              message: "Not authorized to send messages. Please join a conversation first.",
            });
            return;
          }

          const conversation = await prisma.conversation.findFirst({
            where: { incidentTicketId },
          });

          if (!conversation) {
            socket.emit("error", {
              message: `Conversation not found for ticket: ${incidentTicketId}`,
            });
            return;
          }

          // Create the message
          const message = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderId: userId,
              content: content.trim(),
            },
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });

          // Emit to all clients in the conversation room
          io.to(incidentTicketId).emit("newMessage", message);
          
          console.log(`✉️ Message sent by ${userId} in conversation ${conversation.id}`);

        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Handle typing indicators
    socket.on("typingStart", ({ incidentTicketId }) => {
      const participant = activeParticipants.get(socket.id);
      if (participant) {
        socket.to(incidentTicketId).emit("userTyping", { 
          userId,
          isTyping: true 
        });
      }
    });

    socket.on("typingStop", ({ incidentTicketId }) => {
      const participant = activeParticipants.get(socket.id);
      if (participant) {
        socket.to(incidentTicketId).emit("userTyping", { 
          userId,
          isTyping: false 
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      // Clean up
      activeParticipants.delete(socket.id);
      
      console.log(`🔴 User disconnected: ${userId} (${socket.id}) - Reason: ${reason}`);
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error(`Connection error for user ${userId}:`, error);
    });
  });
};

export const getSocketIO = () => {
  if (!_io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return _io;
};