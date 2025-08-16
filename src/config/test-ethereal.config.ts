import nodemailer from "nodemailer";
import imap from "imap-simple";
import { EmailIntegrationService } from "../modules/3rd-party-configurables/email-integration/email-integration.service";
import { simpleParser } from "mailparser";

/**
 * THIS IS JUST A TEST FILE FOR SIMULATING DNS INTERCEPTION FOR CALLING OUR WEBHOOK
 * (see ../modules/3rd-party-configurables/email-integration/email-integration.service)
 */

async function createEtherealAccount() {
  const testAccount = await nodemailer.createTestAccount();

  console.log("Ethereal account created:");
  console.log(`User: ${testAccount.user}`);
  console.log(`Pass: ${testAccount.pass}`);
  console.log(`SMTP: ${testAccount.smtp.host}:${testAccount.smtp.port}`);
  console.log(`IMAP: ${testAccount.imap.host}:${testAccount.imap.port}`);
}

// createEtherealAccount();

// const testAccount = {
//   user: "tcaeilcsquixxndy@ethereal.email",
//   pass: "cwRsBRNe38mtX28Yg8",
//   smtp: {
//     port: "smtp.ethereal.email",
//     host: "587",
//   },
//   imap: {
//     port: "imap.ethereal.email",
//     host: "993",
//   },
// };

const smtpUser = "tcaeilcsquixxndy@ethereal.email";
const smtpPass = "cwRsBRNe38mtX28Yg8";
const imapUser = smtpUser;
const imapPass = smtpPass;

const emailIntegrationService = new EmailIntegrationService();

// 1. Send a test email to your tenant email format
async function sendTestEmail() {
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const info = await transporter.sendMail({
    from: "e.ofoneta@scrubbe.com",
    to: "acme@incidents.scrubbe.com", // Tenant's email
    subject: "Raise: incident for bad connection",
    text: `reason: Regular login attempt from different locations
            assignTo: ebubeofoneta@gmail.com
            username: margarete
            priority: LOW
            template: NONE
`,
  });

  console.log("Message sent:", info.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
}

async function pollInbox() {
  const connection = await imap.connect({
    imap: {
      user: imapUser,
      password: imapPass,
      host: "imap.ethereal.email",
      port: 993,
      tls: true,
      authTimeout: 3000,
    },
  });

  await connection.openBox("INBOX");

  setInterval(async () => {
    const searchCriteria = ["UNSEEN"];
    const fetchOptions = { bodies: [""], markSeen: true };

    const results = await connection.search(searchCriteria, fetchOptions);

    for (let res of results) {
      const all = res.parts.find((part) => part.which === "");
      if (!all) continue;

      const parsed = await simpleParser(all.body);

      function getAddressText(addr: any) {
        if (!addr) return undefined;
        if (Array.isArray(addr)) {
          return addr.map((a) => a.text).join(", ");
        }
        return addr.text;
      }

      console.log("===== PARSED ======");
      console.log({
        to: getAddressText(parsed.to),
        from: getAddressText(parsed.from),
        subject: parsed.subject,
        body: parsed.text,
      });

      const payload = {
        to: getAddressText(parsed.to),
        from: getAddressText(parsed.from),
        subject: parsed.subject || "",
        body: parsed.text || "",
      };

      try {
        const result = await emailIntegrationService.handleInboundEmail(
          payload
        );

        console.log("Incident service result:", result);
      } catch (err) {
        console.error("Error handling email:", err);
      }
    }
  }, 5000); // check every 5 seconds
}

// Run both sender and poller
// sendTestEmail();
// pollInbox();

const callhandleInboundEmail = async () => {
  const result = await emailIntegrationService.handleInboundEmail({
    to: "acme@incidents.scrubbe.com",
    from: "e.ofoneta@scrubbe.com",
    subject: "Raise: incident for bad connection",
    body:
      "reason: Regular login attempt from different locations\n" +
      "            assignTo: ebubeofoneta@gmail.com\n" +
      "            username: margarete\n" +
      "            priority: LOW\n" +
      "            template: NONE\n",
  });

  return result;
};

callhandleInboundEmail();
