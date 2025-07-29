import { openai } from "../../lib/openai";
import { JsonSchemaFormat, PromptType } from "./ezra.types";
import { buildPrompt } from "./prompt/promptbuilder";

/**
 * Generic Ezra function:
 * @param {string} type - "rule", "interpretSummary", or "summarizeIncidents"
 * @param {string} userPrompt - user input (natural language)
 * @param {object} extra - extra data (like incidents for summarization)
 */


export const askEzra = async <T>(
  type: PromptType,
  userPrompt: string,
  extra: object = {}
): Promise<T> => {
  const systemPrompt = buildPrompt(type, userPrompt, extra);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // model: "mistralai/mistral-small-3.2-24b-instruct:free",
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

    const cleaned = raw.replace(/```json|```/g, "").trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);

    if (!jsonMatch) throw new Error("No JSON object in model response");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(
      `Error in askEzra: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};


/**
 * Generic Ezra function that streams response
 * @param {string} type - "rule", "interpretSummary", or "summarizeIncidents"
 * @param {string} userPrompt - user input (natural language)
 * @param {object} extra - extra data (like incidents for summarization)
 */


export const askEzraStream = async (
  type: PromptType,
  userPrompt: string,
  extra: object = {}
): Promise<Response> => {
  const systemPrompt = buildPrompt(type, userPrompt, extra);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      // model: "mistralai/mistral-small-3.2-24b-instruct:free",
      stream: true,
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
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          console.error("Streaming error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    const stream = new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "X-Accel-Buffering": "no",
      },
    });

    return stream;
  } catch (error) {
    throw new Error(
      `Error in askEzraStream: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
