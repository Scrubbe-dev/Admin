"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openai = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
    // apiKey: process.env.OPEN_ROUTER_API_KEY, 
    // baseURL: "https://openrouter.ai/api/v1",
});
