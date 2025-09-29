"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailServiceFactory = void 0;
const sendgrid_email_service_1 = require("./sendgrid-email.service");
const sendgrid_config_1 = require("../../../config/sendgrid.config");
class EmailServiceFactory {
    static create() {
        return new sendgrid_email_service_1.SendGridEmailService(sendgrid_config_1.sendGridConfig);
    }
}
exports.EmailServiceFactory = EmailServiceFactory;
