import { ExtraData, PromptType } from "../ezra.types";

/**
 * Build prompt templates for different Ezra tasks
 * Types: "rule", "interpretSummary", "summarizeIncidents"
 */

export const buildPrompt = (
  type: PromptType,
  userPrompt: string,
  data: ExtraData = {}
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
You are Ezra, an AI analyst. Convert the user's natural language request into structured filters and timeframe.

USER REQUEST:
"${userPrompt}"

TASK:
- Determine priority (High/Medium/Low/Critical) if explicitly stated; otherwise null.
- Determine timeframe:
  * Interpret any relative or vague date range (e.g., "yesterday", "3 days ago", "2 weeks ago", "last month", "ever").
  * For phrases like "ever" or "all time", set start far in the past (e.g., 1970-01-01T00:00:00Z) and end as today’s midnight UTC.
  * For **exact day mentions** ("yesterday", "1 day ago"), return that day’s midnight-to-midnight range.
  * For phrases like "**X days ago**" or "**X weeks ago**", interpret as a **range of that duration ending on that date**.  
    Example: "7 days ago" → { start: 14 days ago 00:00Z, end: 7 days ago 00:00Z }
  * For explicit ranges like "last month" or "past 2 weeks", calculate full range appropriately.
  * If no timeframe is mentioned, default to last 7 days (start = 7 days ago midnight, end = today midnight).
- Always output ISO 8601 UTC format: YYYY-MM-DDTHH:mm:ssZ
- Always align start to 00:00:00 UTC of the starting day, and end to 00:00:00 UTC of the day after the period ends.

Examples:
- "yesterday" → { start: [yesterday 00:00Z], end: [today 00:00Z] }
- "3 days ago" → { start: [6 days ago 00:00Z], end: [3 days ago 00:00Z] }
- "2 weeks ago" → { start: [28 days ago 00:00Z], end: [14 days ago 00:00Z] }
- "last month" → { start: [first day of last month 00:00Z], end: [first day of current month 00:00Z] }
- "ever" → { start: 1970-01-01T00:00:00Z, end: [today 00:00Z] }

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
      if (!data.incidents || data.incidents.length === 0) {
        return "No incidents found for the selected time range.";
      }
      return `
You are Ezra, an AI analyst. Summarize the incidents into a **readable report**.

INCIDENTS DATA (JSON):
${JSON.stringify(
  data.incidents?.map((i) => ({
    title: i.title,
    priority: i.priority,
    description: i.description,
    createdAt: i.createdAt,
  }))
)}

TASK:
- Summarize in **plain text**, not JSON.
- For each incident, use this structure (no numbering or bullets):
  Title: <summarized title>
  Priority: <priority level>
  Description: <detailed but concise explanation, combine key context and actions taken or pending>

- Ensure descriptions include **context of impact, cause (if known), and next steps**.
- Do NOT wrap with code blocks or JSON.
- Separate each incident with a blank line.
`;

    default:
      throw new Error("Unknown prompt type");
  }
};
