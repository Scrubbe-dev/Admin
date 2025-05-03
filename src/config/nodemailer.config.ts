export const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'Gmail', // e.g., 'Gmail', 'SendGrid'
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587',10),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    from: `"Scrubbe" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  };