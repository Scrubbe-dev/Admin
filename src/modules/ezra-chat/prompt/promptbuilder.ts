import { ExtraData, PromptType } from "../ezra.types";
import dotenv from "dotenv";
import {
  determineRiskScore,
  incidentFiveWhys,
  incidentStakeholderMessage,
  interpretPrompt,
  recommendedAction,
  rootCauseSuggestion,
  rule,
  summarizeIncidents,
  visualGraph,
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
): string => {
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

    case "visualGraph":
      return visualGraph();

    case "rootCauseSuggestion":
      return rootCauseSuggestion();

    case "generateFiveWhys":
      return incidentFiveWhys();

    case "generateStakeHolderMessage":
      return incidentStakeholderMessage();

    default:
      throw new Error("Unknown prompt type");
  }
};
