import { ExtraData, PromptType } from "../ezra.types";
import dotenv from "dotenv";
import {
  determineRiskScore,
  interpretPrompt,
  recommendedAction,
  rule,
  summarizeIncidents,
} from "./prompt";

dotenv.config();

/**
 * Build prompt templates for different Ezra tasks
 * Types: "rule", "interpretSummary", "summarizeIncidents"
 */

export const buildPrompt = (
  type: PromptType,
  userPrompt: string,
  data: ExtraData = {}
) => {
  switch (type) {
    case "rule":
      return rule(userPrompt);

    case "interpretPrompt":
      return interpretPrompt(userPrompt);

    case "summarizeIncidents":
      return summarizeIncidents(data);

    case "determineRiskScore":
      return determineRiskScore();

    case "recommendedAction":
      return recommendedAction();

    default:
      throw new Error("Unknown prompt type");
  }
};
