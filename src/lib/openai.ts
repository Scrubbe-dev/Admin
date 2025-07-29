import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // TODO: change to OPEN_API key in prod
  // apiKey: process.env.OPEN_ROUTER_API_KEY, // change to OPEN_API key in prod
  // baseURL: "https://openrouter.ai/api/v1", // remove when using OpenAI directly
});
