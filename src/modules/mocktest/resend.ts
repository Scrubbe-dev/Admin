import { Router, Response, Request } from "express";
import { createEmailServiceWithSes } from "../auth/services/ses-email.factory";

const sendMailerRouter = Router();
const emailService = createEmailServiceWithSes();

async function sendMail(request: Request, response: Response) {
  try {
    const defaultRecipient =
      process.env.AWS_SES_TEST_TO ||
      process.env.AWS_SES_FROM_EMAIL ||
      process.env.FROM_EMAIL ||
      "test@example.com";

    await emailService.sendCustomEmail({
      to: [defaultRecipient],
      subject: "AWS SES Test Email",
      html: "<strong>It works!</strong>",
      text: "It works!",
    });

    response.json({ message: "mail sent successfully" });
  } catch (err) {
    response.status(500).json({ message: `${err} from sending mail` });
  }
}

sendMailerRouter.get("/test/sendmailer", sendMail);
export default sendMailerRouter;
