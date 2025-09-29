"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrompt = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const prompt_1 = require("./prompt");
dotenv_1.default.config();
/**
 * Build prompt templates for different Ezra tasks
 * Types: "rule", "interpretSummary", "summarizeIncidents"
 */
const buildPrompt = (type, userPrompt, data = {}) => {
    switch (type) {
        case "rule":
            return (0, prompt_1.rule)(userPrompt);
        case "interpretPrompt":
            return (0, prompt_1.interpretPrompt)(userPrompt);
        case "summarizeIncidents":
            return (0, prompt_1.summarizeIncidents)(data);
        case "determineRiskScore":
            return (0, prompt_1.determineRiskScore)();
        case "recommendedAction":
            return (0, prompt_1.recommendedAction)();
        case "visualGraph":
            return (0, prompt_1.visualGraph)();
        case "rootCauseSuggestion":
            return (0, prompt_1.rootCauseSuggestion)();
        case "generateFiveWhys":
            return (0, prompt_1.incidentFiveWhys)();
        case "generateStakeHolderMessage":
            return (0, prompt_1.incidentStakeholderMessage)();
        default:
            throw new Error("Unknown prompt type");
    }
};
exports.buildPrompt = buildPrompt;
