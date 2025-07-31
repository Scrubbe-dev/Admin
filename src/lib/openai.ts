import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
  // apiKey: process.env.OPEN_ROUTER_API_KEY, 
  // baseURL: "https://openrouter.ai/api/v1",
});
