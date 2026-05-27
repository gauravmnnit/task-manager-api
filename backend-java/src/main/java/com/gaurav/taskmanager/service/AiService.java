package com.gaurav.taskmanager.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    private static final Logger log = LoggerFactory.getLogger(AiService.class);
    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.3-70b-versatile";

    @Value("${app.groq.apikey:}") private String apiKey;

    private final HttpClient http = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public record AiTaskMetadata(String category, String priority, List<String> subtasks, String title, Instant dueDate) {}

    /**
     * Parse natural language task — returns category, priority, subtasks, title, dueDate.
     * Falls back gracefully when Groq key is absent.
     */
    public AiTaskMetadata parseNaturalLanguageTask(String input) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GROQ_API_KEY not set — returning fallback AI metadata");
            return fallback(input);
        }
        try {
            String systemPrompt = """
                    Extract structured task data from the user's input.
                    Return STRICT JSON only, no markdown, no explanation.

                    Format:
                    {
                      "title": "",
                      "dueDate": "",
                      "priority": "",
                      "category": "",
                      "subtasks": ["", "", ""]
                    }

                    Rules:
                    - title: clean short task title extracted from the input
                    - dueDate: ISO 8601 format or null if not mentioned
                    - priority: High, Medium, or Low based on urgency
                    - category: one of Work, Personal, Health, Study, Finance, Shopping, Social, Other
                    - subtasks: array of exactly 3 short actionable steps
                    - Current date for reference: %s
                    """.formatted(Instant.now());

            String body = mapper.writeValueAsString(Map.of(
                    "model", MODEL,
                    "temperature", 0.2,
                    "response_format", Map.of("type", "json_object"),
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", input)
                    )
            ));

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(resp.body());
            String content = root.at("/choices/0/message/content").asText();
            JsonNode parsed = mapper.readTree(content);

            String title    = parsed.path("title").asText(input);
            String priority = parsed.path("priority").asText("Medium");
            String category = parsed.path("category").asText("Personal");
            String dueDateStr = parsed.path("dueDate").asText(null);
            Instant dueDate = (dueDateStr != null && !dueDateStr.isBlank() && !dueDateStr.equals("null"))
                    ? Instant.parse(dueDateStr) : null;

            List<String> subtasks = List.of();
            JsonNode subtasksNode = parsed.path("subtasks");
            if (subtasksNode.isArray()) {
                subtasks = mapper.convertValue(subtasksNode, mapper.getTypeFactory()
                        .constructCollectionType(List.class, String.class));
            }

            return new AiTaskMetadata(category, priority, subtasks, title, dueDate);

        } catch (Exception e) {
            log.error("AiService error: {}", e.getMessage());
            return fallback(input);
        }
    }

    /**
     * Generate a productivity summary for a list of tasks.
     */
    public String generateProductivitySummary(List<Map<String, Object>> tasks) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Unable to generate productivity summary (GROQ_API_KEY not configured).";
        }
        try {
            String systemPrompt = """
                    You are a productivity coach.
                    Analyze the user's task list and provide:
                    - A short productivity summary
                    - Pending work analysis
                    - One actionable improvement suggestion
                    Keep the response under 120 words. Be concise and encouraging.
                    """;

            String body = mapper.writeValueAsString(Map.of(
                    "model", MODEL,
                    "temperature", 0.5,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", mapper.writeValueAsString(tasks))
                    )
            ));

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(resp.body());
            return root.at("/choices/0/message/content").asText("Unable to generate summary.");
        } catch (Exception e) {
            log.error("generateProductivitySummary error: {}", e.getMessage());
            return "Unable to generate productivity summary.";
        }
    }

    private AiTaskMetadata fallback(String input) {
        return new AiTaskMetadata(
                "Personal", "Medium",
                List.of("Plan task", "Execute task", "Review progress"),
                input, null
        );
    }
}
