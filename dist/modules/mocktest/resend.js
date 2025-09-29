"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resend_1 = require("resend");
const express_1 = require("express");
const sendMailerRouter = (0, express_1.Router)();
const resend = new resend_1.Resend('re_4hDMRFZg_3j178uSm9WRJZwURnjmwgzT9');
async function sendMail(request, response) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Acme <onboarding@resend.dev>',
            to: ['uchennnachinka4@gmail.com'],
            subject: 'Hello World',
            html: '<strong>It works!</strong>',
        });
        if (error) {
            return console.error({ error });
        }
        response.json({ message: "mail sent successfully", data, error });
    }
    catch (err) {
        response.send({ message: `${err} from sending mail` });
    }
}
sendMailerRouter.get("/test/sendmailer", sendMail);
exports.default = sendMailerRouter;
