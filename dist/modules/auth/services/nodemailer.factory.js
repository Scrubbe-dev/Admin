"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailService = void 0;
const nodemailer_email_service_1 = require("./nodemailer-email.service");
const nodemailers_config_1 = require("../../../config/nodemailers.config");
const createEmailService = () => {
    (0, nodemailers_config_1.validateEmailConfig)(nodemailers_config_1.nodemailerConfig);
    return new nodemailer_email_service_1.NodemailerEmailService(nodemailers_config_1.nodemailerConfig);
};
exports.createEmailService = createEmailService;
