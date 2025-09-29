"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioClient = exports.twilioConfig = void 0;
const twilio_1 = require("twilio");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.twilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    twilioWhatsapp: process.env.TWILIO_WHATSAPP,
    twiliosms: process.env.TWILIO_SMS,
};
exports.twilioClient = new twilio_1.Twilio(exports.twilioConfig.accountSid, exports.twilioConfig.authToken);
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
