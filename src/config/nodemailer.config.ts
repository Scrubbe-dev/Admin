import Mailgun from "mailgun.js";
import dotenv from "dotenv";
dotenv.config();



// service: 'Resend',
//       host: "smtp.resend.com",
//       port: 465, // Use 465 for Resend
//       secure: true, // Resend uses SSL on port 465
//       auth: {
//         user: "resend", // Fixed username for Resend
//         pass: process.env.RESEND_API_KEY!, // Use Resend API key
//       },
//       from: {
//         email: process.env.FROM_EMAIL || "onboarding@resend.dev",
//         name: process.env.FROM_NAME || "Scrubbe",
//       },
//       replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL,
//       cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"),
//       connectionTimeout: 30000, // 30 seconds
//       socketTimeout: 30000, // 30 seconds

export const emailConfig = {
 // e.g., 'Gmail', 'SendGrid'
  host: process.env.EMAIL_HOST || "smtp.resend.com",
  port: parseInt(process.env.EMAIL_PORT || "465", 10),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || "resend",
    pass: process.env.EMAIL_PASSWORD || "re_jnPgXfz2_KKCMtDPwdytWiY686JEpfkZk",
  },
  from: `"Scrubbe" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || ""}>`,
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
};

// Validate email configuration
if (!emailConfig.auth.user || !emailConfig.auth.pass) {
  console.error("Email configuration is incomplete. Please check EMAIL_USER and EMAIL_PASSWORD environment variables.");
  // In a production environment, you might want to throw an error here
  // throw new Error("Email configuration is incomplete");
}
// const emailConfigMailGun = new Mailgun(FormData);
// export const mailGunConfig = emailConfigMailGun.client({
//   username: process.env.MAILGUN_DOMAIN!!,
//   key: process.env.MAILGUN_API_KEY!!,
// });

// const mailgunData = {
//   from: 'mailer@example.com>',
//   to: 'recipient@example.com',
//   subject: `Email ${title}`,
//  html
//   template: 'name-of-the-template-you-made-in-mailgun-web-portal',
//   'h:X-Mailgun-Variables': JSON.stringify({ // be sure to stringify your payload
//     title,
//     slug,
//   }),
//   'h:Reply-To': 'reply-to@example.com',
// };

// try {
//   const response = await mailgun.messages.create(DOMAIN_NAME, mailgunData);
