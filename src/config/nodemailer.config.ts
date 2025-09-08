import dotenv from "dotenv";
dotenv.config();

export const emailConfig = {
  service: process.env.EMAIL_SERVICE || "Gmail",
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "465", 10), // Changed to 465 (SSL)
  secure: process.env.EMAIL_SECURE === "true" || true, // Changed to true for SSL
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASSWORD || "",
  },
  from: `"Scrubbe" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || ""}>`,
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: process.env.NODE_ENV === "production",
    // Enable TLS 1.2 and 1.3
    minVersion: "TLSv1.2",
  },
  // Add additional connection options
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
};

// Validate email configuration
if (!emailConfig.auth.user || !emailConfig.auth.pass) {
  console.error("Email configuration is incomplete. Please check EMAIL_USER and EMAIL_PASSWORD environment variables.");
  throw new Error("Email configuration is incomplete");
}

// Log configuration (without sensitive data)
console.log("Email configuration:", {
  service: emailConfig.service,
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  tls: emailConfig.tls,
});



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
