const Groq = require("groq-sdk");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const FALLBACK_METADATA = {
  category: "Personal",
  priority: "Medium",
  subtasks: ["Plan task", "Execute task", "Review progress"],
};

/**
 * Generate AI metadata for a task
 * Returns:
 * {
 *   category,
 *   priority,
 *   subtasks
 * }
 */
async function generateTaskMetadata(taskDescription) {
  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",

      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: `
                  You are a task management assistant.
                  Analyze the given task and return STRICT JSON only.

                  Format:
                  {
                    "category": "",
                    "priority": "",
                    "subtasks": ["", "", ""]
                  }

                  Rules:
                  - category must be one of: Work, Personal, Health, Study, Finance, Shopping, Social, Other
                  - priority must be one of: High, Medium, Low
                  - subtasks must be an array of exactly 3 short actionable steps
                  - Return JSON only, no markdown, no explanation
            `,
        },
        {
          role: "user",
          content: `Task: ${taskDescription}`,
        },
      ],

      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0].message.content);

    return {
      category: parsed.category || FALLBACK_METADATA.category,
      priority: parsed.priority || FALLBACK_METADATA.priority,
      subtasks:
        Array.isArray(parsed.subtasks) && parsed.subtasks.length > 0
          ? parsed.subtasks
          : FALLBACK_METADATA.subtasks,
    };
  } catch (e) {
    console.error("generateTaskMetadata Error:", e.message);
    return FALLBACK_METADATA;
  }
}

/**
 * Natural language task parser
 *
 * Example:
 * "Finish Oracle prep next Friday at 6 PM"
 *
 * Returns:
 * {
 *   title,
 *   dueDate,
 *   priority
 * }
 */
async function parseNaturalLanguageTask(inputText) {
  try {
    const response = await client.chat.completions.create({
      model: "llama3-8b-8192",

      response_format: { type: "json_object" },

      messages: [
        {
          role: "system",
          content: `
                  Extract structured task data from the user's input.
                  Return STRICT JSON only, no markdown, no explanation.

                  Format:
                  {
                    "title": "",
                    "dueDate": "",
                    "priority": ""
                  }

                  Rules:
                  - title should be a clean short task title extracted from the input
                  - dueDate should be in ISO 8601 format (e.g. 2026-05-27T18:00:00.000Z), or null if not mentioned
                  - priority must be High, Medium, or Low based on urgency words in the input
                  - Current date for reference: ${new Date().toISOString()}
                  `,
        },
        {
          role: "user",
          content: inputText,
        },
      ],

      temperature: 0.2,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("parseNaturalLanguageTask Error:", error.message);
    return {
      title: inputText,
      dueDate: null,
      priority: "Medium",
    };
  }
}

/**
 * AI productivity summary
 */
async function generateProductivitySummary(tasks) {
  try {
    const formattedTasks = tasks.map((task) => ({
      title: task.title,
      completed: task.completed,
      priority: task.priority,
      category: task.category,
    }));

    const response = await client.chat.completions.create({
      model: "llama3-8b-8192",

      messages: [
        {
          role: "system",
          content: `
                  You are a productivity coach.
                  Analyze the user's task list and provide:
                  - A short productivity summary
                  - Pending work analysis
                  - One actionable improvement suggestion

                  Keep the response under 120 words. Be concise and encouraging.
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
    console.error("generateProductivitySummary Error:", error.message);
    return "Unable to generate productivity summary.";
  }
}

module.exports = {
  generateTaskMetadata,
  parseNaturalLanguageTask,
  generateProductivitySummary,
};