"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.templatesDir = exports.getTemplatePath = void 0;
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
// For ES modules
const __filename = (0, url_1.fileURLToPath)(process.env.BASE_URL);
const __dirname = path_1.default.dirname(__filename);
const getTemplatePath = (templateName) => {
    return path_1.default.join(__dirname, 'templates', 'emails', templateName);
};
exports.getTemplatePath = getTemplatePath;
// Or if you need the base templates directory
exports.templatesDir = path_1.default.join(__dirname, 'templates', 'emails');
