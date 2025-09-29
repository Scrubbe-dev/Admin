"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauth2Client = exports.googleConfig = void 0;
const googleapis_1 = require("googleapis");
exports.googleConfig = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URL,
    scopes: [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
    ],
};
exports.oauth2Client = new googleapis_1.google.auth.OAuth2(exports.googleConfig.clientId, exports.googleConfig.clientSecret, exports.googleConfig.redirectUri);
