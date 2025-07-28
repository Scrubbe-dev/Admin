import { ExtraData, PromptType } from "../ezra.types";

/**
 * Build prompt templates for different Ezra tasks
 * Types: "rule", "interpretSummary", "summarizeIncidents"
 */

export const buildPrompt = (
  type: PromptType,
  userPrompt: string,
  extra: ExtraData = {}
) => {
  const enforceJson = `
IMPORTANT:
- Respond ONLY with valid JSON matching the schema below.
- Do not include any explanation, reasoning, or markdown fences (e.g., no \`\`\`json).
- The top-level structure MUST match exactly.
- Do not include reasoning, thoughts, or explanations. 
- If unsure, output empty JSON object "{}".
`;

  switch (type) {
    case "rule":
      return `
You are Ezra, an AI security analyst that converts natural language into structured detection rules.

USER PROMPT:
"${userPrompt}"

TASK:
- Extract these fields:
  1. metric (e.g., "failed login attempts", "transaction amount")
  2. threshold (integer)
  3. timeWindow (duration string: e.g., "2 minutes")
  4. actions (list of actions: "block IP", "notify admin")

OUTPUT SCHEMA:
{
  "metric": "string",
  "threshold": number,
  "timeWindow": "string",
  "actions": ["string"]
}

${enforceJson}
`;

    case "interpretSummary":
      return `
You are Ezra, an AI analyst. Extract filters and timeframe from the user's incident summary request.

USER REQUEST:
"${userPrompt}"

TASK:
- Identify priority (High/Medium/Low) if specified.
- Identify incident type (e.g., Failed Login, Account Takeover).
- Convert relative dates ("yesterday", "last 3 hours") into ISO 8601 start/end.
- Default timeframe: last 24 hours if none given.

OUTPUT SCHEMA:
{
  "priority": "string | null",
  "timeframe": {
    "start": "YYYY-MM-DDTHH:mm:ssZ",
    "end": "YYYY-MM-DDTHH:mm:ssZ"
  }
}

${enforceJson}
`;

    case "summarizeIncidents":
      return `
You are Ezra, an AI analyst. Summarize these incidents in plain language with structured fields.

INCIDENTS JSON:
${JSON.stringify(
  extra.incidents?.map((i) => ({
    id: i.id,
    title: i.title,
    priority: i.priority,
    createdAt: i.createdAt,
  }))
)}

TASK:
- Summarize incidents clearly.
- Each summary must include: incident, priority, action, impact.

OUTPUT SCHEMA:
{
  "summaries": [
    { "incident": "string", "priority": "string", "action": "string", "impact": "string" }
  ]
}

${enforceJson}
`;

    default:
      throw new Error("Unknown prompt type");
  }
};
