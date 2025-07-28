import { openai } from "../../lib/openai";
import { JsonSchemaFormat, PromptType } from "./ezra.types";
import { buildPrompt } from "./prompt/promptbuilder";

/**
 * Generic Ezra function:
 * @param {string} type - "rule", "interpretSummary", or "summarizeIncidents"
 * @param {string} userPrompt - user input (natural language)
 * @param {object} schema - JSON schema to enforce structured response
 * @param {object} extra - extra data (like incidents for summarization)
 */

//  TODO - add type for extra
//  TODO - MAKE ASK EZRA GENERIC

export const askEzra = async (
  type: PromptType,
  userPrompt: string,
  schema: Object | null,
  extra: object = {}
) => {
  const systemPrompt = buildPrompt(type, userPrompt, extra);
  try {
    const completion = await openai.chat.completions.create({
      model: "mistralai/mistral-small-3.2-24b-instruct:free",
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    console.log(
      "===================== raw message: =====================",
      completion.choices[0]?.message
    );

    console.log("===================== raw: =====================", raw);

    const cleaned = raw.replace(/```json|```/g, "").trim();
    console.log(
      "===================== cleaned message: =====================",
      cleaned
    );

    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

    if (!jsonMatch) throw new Error("No JSON object in model response");

    console.log(
      "===================== JSON match: =====================",
      jsonMatch[0]
    );
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(
      `Error in askEzra: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
