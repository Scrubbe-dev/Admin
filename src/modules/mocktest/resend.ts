import { Resend } from 'resend';
import { Router, Response, Request } from "express";

const sendMailerRouter = Router()
const resend = new Resend('re_4hDMRFZg_3j178uSm9WRJZwURnjmwgzT9');

async function sendMail(request:Request,response:Response){ 
  try{ 
    const { data, error } = await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: ['uchennnachinka4@gmail.com'],
        subject: 'Hello World',
        html: '<strong>It works!</strong>',
    });

    if (error) {
        return console.error({ error });
    }

      response.json({message: "mail sent successfully", data , error})
    }catch(err){
      response.send({message: `${err} from sending mail`})
    }
 }



  sendMailerRouter.get("/test/sendmailer",sendMail);
  export default sendMailerRouter;