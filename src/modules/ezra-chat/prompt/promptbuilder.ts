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

    case "interpretPrompt":
      return `
You are Ezra, an AI analyst. Convert the user's natural language request into structured filters and timeframe.

USER REQUEST:
"${userPrompt}"

TASK:
1. Determine "wantsAction":
   - true = user clearly requests data incident retrieval, summaries, reports, investigations, or queries.
   - false = user is making small talk, asking about you, or vague questions not about data.
   - Default to false if ambiguous.
Examples:
- "Summarize high-risk login incidents this week". wantsAction: true
- "Hey Ezra, how are you doing today?" → wantsAction: false

2. Determine "confirmSuggestion":
    - true ONLY if:
     * The user explicitly **confirms or agrees** to a **previous AI suggestion** (e.g., escalate, raise Jira ticket, report incident).
     * Phrases like: "yes", "sure", "ok", "go ahead", "please do it", "yeah raise it".
    - false if:
     * The message is a **new request unrelated to a previous suggestion**.
     * The AI previously offered generic help (“feel free to ask”) and user simply continues conversation.

3. Determine priority (High/Medium/Low/Critical) if explicitly stated; otherwise null.

4. Determine timeframe:
  * Interpret any relative or vague date range (e.g., "yesterday", "3 days ago", "2 weeks ago", "last month", "ever").
  * For phrases like "ever" or "all time", set start far in the past (e.g., 1970-01-01T00:00:00Z) and end as today’s midnight UTC.
  * For **exact day mentions** ("yesterday", "1 day ago"), return that day’s midnight-to-midnight range.
  * For phrases like "**X days ago**" or "**X weeks ago**", interpret as a **range of that duration ending on that date**.  
    Example: "7 days ago" → { start: 14 days ago 00:00Z, end: 7 days ago 00:00Z }
  * For explicit ranges like "last month" or "past 2 weeks", calculate full range appropriately.
  * If no timeframe is mentioned, default to last 7 days (start = 7 days ago midnight, end = today midnight).
   
5. Extract searchTerms:
  * Identify only meaningful entities or topics (e.g., "login", "fingerprint anomalies", "location mismatches").
  * EXCLUDE:
      - Any priority words (high, medium, low, critical) if already extracted into priority.
      - Generic terms like "incident", "incident(s)", "alert(s)".
  * Do NOT include filler words, verbs, or time expressions.
  * Split compound topics into separate concise lowercase phrases.
  * Split compound phrases into individual concise lowercase keywords (e.g., "failed logins" → ["failed", "logins"]).
  * Preserve multi-word concepts only if they represent a single specific entity (e.g., "fingerprint anomalies").
  * If no meaningful keywords remain after filtering, return [].
  * for example, a prompt like this "Ezra summarize high priority incidents ever" have no meaningful word to extract from so return [] if so.
   
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
  "wantsAction": boolean,
  "confirmSuggestion": boolean,
  "priority": "string | null",
  "timeframe": {
    "start": "YYYY-MM-DDTHH:mm:ssZ",
    "end": "YYYY-MM-DDTHH:mm:ssZ"
  },
  "searchTerms": ["string", "string"]
}

${enforceJson}
`;

    case "summarizeIncidents":
      return `
You are Ezra, an AI analyst. Summarize the incidents into a **readable report**.
Your name is Ezra, an AI analyst/assistant that works for scrubbe.

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
1. If INCIDENTS exist:
- Summarize them into a **clear, readable report**.
- Summarize in **plain text**, not JSON.
- For each incident, use this structure (no numbering or bullets):
  Title: <summarized title>
  Priority: <priority level>
  Description: <concise explanation with context of impact, known cause, and actions taken/pending>

  2. If no INCIDENTS exists:
   - Interpret the user query conversationally but stay relevant to **incident management** (e.g., provide advice on reporting, monitoring, or preventive measures).
   - Example: If user asks “What do you think about reporting failed logins?”, respond with practical guidance (“Reporting failed logins is important if thresholds are exceeded or suspicious patterns are detected…”).

3. After summary or conversational advice:
   - If urgency is detected (High/Critical incidents) or user hints at reporting/escalation:
    * Suggest next steps: “Would you like to raise an incident?”
   - Otherwise, simply summarize or advise without suggesting tools.

STYLE:
- Plain text, no JSON or code blocks.
- Keep it professional but approachable.
- Be brief but informative.
`;

    default:
      throw new Error("Unknown prompt type");
  }
};
