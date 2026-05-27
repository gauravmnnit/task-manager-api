package com.gaurav.taskmanager.controller;

import com.gaurav.taskmanager.model.Task;
import com.gaurav.taskmanager.model.User;
import com.gaurav.taskmanager.repository.TaskRepository;
import com.gaurav.taskmanager.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    @Autowired private TaskRepository taskRepo;
    @Autowired private AiService aiService;

    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);

    // ── GET /analytics/activity ────────────────────────────────────────────────
    @GetMapping("/activity")
    public ResponseEntity<?> activity(Authentication auth) {
        User user = (User) auth.getPrincipal();
        String ownerId = user.getId();

        List<Task> allTasks = taskRepo.findByOwner(ownerId);
        List<Task> completedTasks = allTasks.stream()
                .filter(t -> Boolean.TRUE.equals(t.getCompleted()) && t.getCompletedAt() != null)
                .sorted(Comparator.comparing(Task::getCompletedAt))
                .toList();

        Instant now = Instant.now();

        // Weekly activity (last 7 days)
        List<Map<String, Object>> weeklyActivity = buildDailyActivity(completedTasks, now, 7);

        // Monthly activity (last 30 days)
        List<Map<String, Object>> monthlyActivity = buildDailyActivity(completedTasks, now, 30);

        // Current streak
        int currentStreak = computeCurrentStreak(completedTasks, now);

        // Longest streak
        int longestStreak = computeLongestStreak(completedTasks);

        // Totals
        long totalTasks     = allTasks.size();
        long completedCount = completedTasks.size();
        long pendingTasks   = totalTasks - completedCount;

        // Per-task analytics
        List<Map<String, Object>> taskAnalytics = allTasks.stream().map(task -> {
            Long compMs = (task.getCompletedAt() != null && task.getCreatedAt() != null)
                    ? task.getCompletedAt().toEpochMilli() - task.getCreatedAt().toEpochMilli() : null;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",                task.getId());
            m.put("description",       task.getDescription());
            m.put("completed",         task.getCompleted());
            m.put("createdAt",         task.getCreatedAt());
            m.put("completedAt",       task.getCompletedAt());
            m.put("completionTimeMs",  compMs);
            m.put("completionTimeHours", compMs != null ? Math.round(compMs / 3_600_000.0 * 10) / 10.0 : null);
            m.put("completionTimeDays",  compMs != null ? Math.round(compMs / 86_400_000.0 * 10) / 10.0 : null);
            m.put("isOverdue", !Boolean.TRUE.equals(task.getCompleted())
                    && task.getCreatedAt() != null
                    && (now.toEpochMilli() - task.getCreatedAt().toEpochMilli()) > 7L * 24 * 3600 * 1000);
            return m;
        }).toList();

        // Avg completion time
        OptionalDouble avg = taskAnalytics.stream()
                .filter(m -> m.get("completionTimeMs") != null)
                .mapToLong(m -> (Long) m.get("completionTimeMs"))
                .average();
        Double avgMs    = avg.isPresent() ? avg.getAsDouble() : null;

        // Pending by age
        Map<String, Integer> pendingByAge = new LinkedHashMap<>();
        pendingByAge.put("today", 0); pendingByAge.put("thisWeek", 0);
        pendingByAge.put("thisMonth", 0); pendingByAge.put("older", 0);
        allTasks.stream().filter(t -> !Boolean.TRUE.equals(t.getCompleted())).forEach(t -> {
            if (t.getCreatedAt() == null) return;
            double days = (now.toEpochMilli() - t.getCreatedAt().toEpochMilli()) / 86_400_000.0;
            if (days < 1)       pendingByAge.merge("today", 1, Integer::sum);
            else if (days < 7)  pendingByAge.merge("thisWeek", 1, Integer::sum);
            else if (days < 30) pendingByAge.merge("thisMonth", 1, Integer::sum);
            else                pendingByAge.merge("older", 1, Integer::sum);
        });

        // Fastest / slowest
        OptionalLong fastest = taskAnalytics.stream()
                .filter(m -> m.get("completionTimeMs") != null)
                .mapToLong(m -> (Long) m.get("completionTimeMs")).min();
        OptionalLong slowest = taskAnalytics.stream()
                .filter(m -> m.get("completionTimeMs") != null)
                .mapToLong(m -> (Long) m.get("completionTimeMs")).max();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalTasks",           totalTasks);
        result.put("completedTasks",       completedCount);
        result.put("pendingTasks",         pendingTasks);
        result.put("currentStreak",        currentStreak);
        result.put("longestStreak",        longestStreak);
        result.put("weeklyActivity",       weeklyActivity);
        result.put("monthlyActivity",      monthlyActivity);
        result.put("taskAnalytics",        taskAnalytics);
        result.put("avgCompletionTime",    avgMs);
        result.put("avgCompletionTimeHours", avgMs != null ? Math.round(avgMs / 3_600_000.0 * 10) / 10.0 : null);
        result.put("avgCompletionTimeDays",  avgMs != null ? Math.round(avgMs / 86_400_000.0 * 10) / 10.0 : null);
        result.put("pendingTasksByAge",    pendingByAge);
        result.put("fastestCompletion",    fastest.isPresent() ? fastest.getAsLong() : null);
        result.put("slowestCompletion",    slowest.isPresent() ? slowest.getAsLong() : null);

        return ResponseEntity.ok(result);
    }

    // ── GET /analytics/productivity-summary ────────────────────────────────────
    @GetMapping("/productivity-summary")
    public ResponseEntity<?> productivitySummary(Authentication auth) {
        User user = (User) auth.getPrincipal();
        List<Task> tasks = taskRepo.findByOwner(user.getId());
        List<Map<String, Object>> payload = tasks.stream().map(t -> {
            Map<String, Object> m = new HashMap<>();
            m.put("title",     t.getDescription());
            m.put("completed", t.getCompleted());
            m.put("priority",  t.getPriority());
            m.put("category",  t.getCategory());
            return m;
        }).toList();
        String summary = aiService.generateProductivitySummary(payload);
        return ResponseEntity.ok(Map.of("summary", summary));
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private List<Map<String, Object>> buildDailyActivity(List<Task> completed, Instant now, int days) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            Instant dayStart = now.minusSeconds((long) i * 86400).truncatedTo(java.time.temporal.ChronoUnit.DAYS);
            Instant dayEnd   = dayStart.plusSeconds(86399);
            String dateStr   = DAY_FMT.format(dayStart);
            long count = completed.stream()
                    .filter(t -> !t.getCompletedAt().isBefore(dayStart) && !t.getCompletedAt().isAfter(dayEnd))
                    .count();
            result.add(Map.of("date", dateStr, "tasksCompleted", count));
        }
        return result;
    }

    private int computeCurrentStreak(List<Task> completed, Instant now) {
        int streak = 0;
        Instant cursor = now.truncatedTo(java.time.temporal.ChronoUnit.DAYS);
        for (int i = 0; i < 365; i++) {
            Instant start = cursor.minusSeconds((long) i * 86400);
            Instant end   = start.plusSeconds(86399);
            boolean anyOnDay = completed.stream()
                    .anyMatch(t -> !t.getCompletedAt().isBefore(start) && !t.getCompletedAt().isAfter(end));
            if (anyOnDay) streak++;
            else break;
        }
        return streak;
    }

    private int computeLongestStreak(List<Task> completed) {
        if (completed.isEmpty()) return 0;
        int longest = 0, temp = 1;
        for (int i = 1; i < completed.size(); i++) {
            Instant prev = completed.get(i - 1).getCompletedAt().truncatedTo(java.time.temporal.ChronoUnit.DAYS);
            Instant curr = completed.get(i).getCompletedAt().truncatedTo(java.time.temporal.ChronoUnit.DAYS);
            long diffDays = (curr.toEpochMilli() - prev.toEpochMilli()) / 86_400_000L;
            if (diffDays == 1) { temp++; }
            else if (diffDays > 1) { longest = Math.max(longest, temp); temp = 1; }
        }
        return Math.max(longest, temp);
    }
}
