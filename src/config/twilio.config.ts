import { Twilio } from "twilio";
import dotenv from "dotenv";

dotenv.config();

export const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID!,
  authToken: process.env.TWILIO_AUTH_TOKEN!,
  twilioWhatsapp: process.env.TWILIO_WHATSAPP!,
  twiliosms: process.env.TWILIO_SMS!,
};

export const twilioClient = new Twilio(
  twilioConfig.accountSid,
  twilioConfig.authToken
);

// const message =
//   `*P1 Incident War Room Alert*\n\n` +
//   `You are requested to join this War Room as there has been a P1 incident reported.\n\n` +
//   `*Incident ID:* ${"[incident.ticketId]"}\n` +
//   `*Details:* ${"[incident.reason]"}\n` +
//   `*Status:* ${"[incident.status]"}\n` +
//   `*Priority:* ${"[incident.priority]"}\n\n` +
//   `Meeting link: ${"[meetingLink]"}`;

// +14155238886 sandbox whatsapp

// async function createMessage() {
//   const message = await twilioClient.messages.create({
//     body: "Hello Testing Message",
//     from: twilioConfig.twiliosms,
//     to: "+447487614645",
//   });

//   console.log("============= Message =============", message.body);
// }

// createMessage();

// const sendWhatsAppMessage = async (to: string, body: string) => {
//   try {
//     await twilioClient.messages
//       .create({
//         from: `whatsapp:${"+14155238886"}`,
//         to: `whatsapp:${to}`,
//         body,
//       })
//       .then((message) => console.log(message.sid));

//     console.log(`WhatsApp message sent to ${to}`);
//   } catch (error) {
//     console.error(`Failed to send WhatsApp message to ${to}`, error);
//   }
// };

// sendWhatsAppMessage("+2349133025755", message);
