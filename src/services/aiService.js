const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


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

            model: 'gpt-4o-mini',

            messages: [
                {
                    role: 'user',
                    content: `Categorize this task and generate 3 subtasks:
                    
Task: ${taskDescription}`
                }
            ]
        })

        console.log(response)

        return {
            category: 'Study',
            priority: 'High',
            subtasks: [
                'Revise concepts',
                'Practice problems',
                'Review notes'
            ]
        }

    } catch (e) {

        console.log('FULL ERROR:')
        console.log(e)

        return {
            category: 'Personal',
            priority: 'Medium',
            subtasks: [
                'Plan task',
                'Execute task',
                'Review progress'
            ]
        }
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
      model: "gpt-4.1-mini",

      response_format: {
        type: "json_object",
      },

      messages: [
        {
          role: "system",
          content: `
Extract structured task data.

Return STRICT JSON only.

Format:
{
  "title": "",
  "dueDate": "",
  "priority": ""
}

Rules:
- dueDate should be ISO format
- priority must be High/Medium/Low
`,
        },
        {
          role: "user",
          content: inputText,
        },
      ],

      temperature: 0.2,
    });

    return JSON.parse(
      response.choices[0].message.content
    );
  } catch (error) {
    console.error("Natural Language Parsing Error:", error);

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
      model: "gpt-4.1-mini",

      messages: [
        {
          role: "system",
          content: `
You are a productivity coach.

Analyze user tasks and provide:
- productivity summary
- pending work analysis
- improvement suggestion

Keep response under 120 words.
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
    console.error("Productivity Summary Error:", error);

    return "Unable to generate productivity summary.";
  }
}

module.exports = {
  generateTaskMetadata,
  parseNaturalLanguageTask,
  generateProductivitySummary,
};