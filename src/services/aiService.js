const OpenAI = require("openai");

// ✅ Fix #11 — Validate API key at startup, fail fast and clearly
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set. AI features will not work.");
}

// ✅ Fix #12 — Single model constant; change once to upgrade everywhere
const AI_MODEL = "gpt-4.1-mini";

// ✅ Fix #7 — Configure timeout and retries on the shared client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 15000, // 15 seconds
  maxRetries: 2,
});

/**
 * Generate AI metadata for a task.
 *
 * @param {string} taskDescription
 * @returns {Promise<{
 *   category: string,
 *   priority: "High"|"Medium"|"Low",
 *   subtasks: string[],
 *   aiError?: true
 * }>}
 */
async function generateTaskMetadata(taskDescription) {
  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL, // ✅ Fix #2 — consistent model name

      // ✅ Fix #3 — enforce structured JSON output
      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          // ✅ Fix #3 — explicit JSON schema in prompt so parsing is safe
          content: `
You are a task categorisation assistant.

Return STRICT JSON only — no prose, no markdown.

Schema:
{
  "category": "<single category string e.g. Work / Study / Health / Personal>",
  "priority": "High" | "Medium" | "Low",
  "subtasks": ["<subtask 1>", "<subtask 2>", "<subtask 3>"]
}
`,
        },
        {
          role: "user",
          content: `Task: ${taskDescription}`,
        },
      ],

      temperature: 0.3,
    });

    // ✅ Fix #1 — actually parse and return the AI response
    const raw = response.choices[0].message.content;

    // ✅ Fix #5 — isolate JSON.parse so a bad response doesn't escape the catch
    try {
      const parsed = JSON.parse(raw);
      return {
        category: parsed.category ?? "Personal",
        priority: parsed.priority ?? "Medium",
        subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks : [],
      };
    } catch {
      console.error("generateTaskMetadata — JSON parse failed. Raw:", raw);
      return {
        category: "Personal",
        priority: "Medium",
        subtasks: ["Plan task", "Execute task", "Review progress"],
        aiError: true, // ✅ Fix #10 — signal to caller that AI output failed
      };
    }
  } catch (e) {
    // ✅ Fix #8 — use console.error, not console.log, for errors
    // ✅ Fix #9 — removed raw console.log(response) debug statement
    console.error("generateTaskMetadata error:", e);

    return {
      category: "Personal",
      priority: "Medium",
      subtasks: ["Plan task", "Execute task", "Review progress"],
      aiError: true, // ✅ Fix #10
    };
  }
}

/**
 * Parse a natural-language task string into structured data.
 *
 * Example input : "Finish Oracle prep next Friday at 6 PM"
 * Example output: { title, dueDate, priority }
 *
 * @param {string} inputText
 * @returns {Promise<{
 *   title: string,
 *   dueDate: string|null,
 *   priority: "High"|"Medium"|"Low",
 *   aiError?: true
 * }>}
 */
async function parseNaturalLanguageTask(inputText) {
  // ✅ Fix #4 — inject today's date so relative dates ("next Friday") resolve correctly
  const today = new Date().toISOString();

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,

      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: `
You are a task extraction assistant. Today's date is ${today}.

Extract structured task data from the user's input.

Return STRICT JSON only — no prose, no markdown.

Schema:
{
  "title": "<concise task title>",
  "dueDate": "<ISO 8601 datetime string, or null if not mentioned>",
  "priority": "High" | "Medium" | "Low"
}

Rules:
- Resolve all relative dates (today, tomorrow, next Friday, etc.) using today's date above.
- If no due date is mentioned, set dueDate to null.
- If no priority is mentioned, infer it from urgency words or default to "Medium".
`,
        },
        {
          role: "user",
          content: inputText,
        },
      ],

      temperature: 0.2,
    });

    const raw = response.choices[0].message.content;

    // ✅ Fix #5 — isolated JSON.parse with its own error handling
    try {
      return JSON.parse(raw);
    } catch {
      console.error("parseNaturalLanguageTask — JSON parse failed. Raw:", raw);
      return { title: inputText, dueDate: null, priority: "Medium", aiError: true };
    }
  } catch (error) {
    console.error("parseNaturalLanguageTask error:", error);
    return {
      title: inputText,
      dueDate: null,
      priority: "Medium",
      aiError: true, // ✅ Fix #10
    };
  }
}

/**
 * Generate a short productivity summary for a list of tasks.
 *
 * @param {Array<{ title: string, completed: boolean, priority: string, category: string }>} tasks
 * @returns {Promise<string>}
 */
async function generateProductivitySummary(tasks) {
  // ✅ Fix #6 — guard against empty task list before hitting the API
  if (!tasks || tasks.length === 0) {
    return "No tasks found. Add some tasks to get a productivity summary.";
  }

  const formattedTasks = tasks.map((task) => ({
    title: task.title,
    completed: task.completed,
    priority: task.priority,
    category: task.category,
  }));

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,

      messages: [
        {
          role: "system",
          content: `
You are a productivity coach.

Analyse the user's tasks and provide:
- A brief productivity summary
- Pending work analysis
- One concrete improvement suggestion

Keep the entire response under 120 words. Plain text only — no bullet symbols or markdown.
`,
        },
        {
          role: "user",
          content: JSON.stringify(formattedTasks),
        },
      ],

      temperature: 0.5,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("generateProductivitySummary error:", error);
    // ✅ Fix #10 — return a structured object so caller can detect the failure
    return {
      summary: "Unable to generate productivity summary.",
      aiError: true,
    };
  }
}

module.exports = {
  generateTaskMetadata,
  parseNaturalLanguageTask,
  generateProductivitySummary,
};