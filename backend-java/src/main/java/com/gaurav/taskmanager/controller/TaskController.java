package com.gaurav.taskmanager.controller;

import com.gaurav.taskmanager.dto.AiTaskRequest;
import com.gaurav.taskmanager.dto.CreateTaskRequest;
import com.gaurav.taskmanager.dto.UpdateTaskRequest;
import com.gaurav.taskmanager.model.Task;
import com.gaurav.taskmanager.model.User;
import com.gaurav.taskmanager.repository.TaskRepository;
import com.gaurav.taskmanager.service.AiService;
import com.gaurav.taskmanager.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class TaskController {

    @Autowired private TaskRepository taskRepo;
    @Autowired private AiService aiService;
    @Autowired private EmailService emailService;

    // ── POST /tasks/ai ────────────────────────────────────────────────────────
    @PostMapping("/tasks/ai")
    public ResponseEntity<?> createAiTask(@RequestBody AiTaskRequest req, Authentication auth) {
        try {
            User user = (User) auth.getPrincipal();
            AiService.AiTaskMetadata meta = aiService.parseNaturalLanguageTask(req.getDescription());

            Task task = new Task();
            task.setDescription(req.getDescription());
            task.setCompleted(false);
            task.setOwner(user.getId());
            task.setCategory(meta.category());
            task.setPriority(meta.priority());
            task.setSubtasks(meta.subtasks());
            task.setDueDate(meta.dueDate());

            task = taskRepo.save(task);
            return ResponseEntity.status(201).body(task);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "AI task creation failed"));
        }
    }

    // ── POST /tasks ───────────────────────────────────────────────────────────
    @PostMapping("/tasks")
    public ResponseEntity<?> createTask(@RequestBody CreateTaskRequest req, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Task task = new Task();
        task.setDescription(req.getDescription());
        task.setCompleted(req.getCompleted() != null ? req.getCompleted() : false);
        task.setOwner(user.getId());
        task.setCategory(req.getCategory());
        task.setPriority(req.getPriority());
        task.setSubtasks(req.getSubtasks());
        task.setDueDate(req.getDueDate());
        task = taskRepo.save(task);
        emailService.sendTaskCreatedEmail(user.getEmail(), user.getName(), task.getDescription());
        return ResponseEntity.status(201).body(task);
    }

    // ── GET /tasks ────────────────────────────────────────────────────────────
    @GetMapping("/tasks")
    public ResponseEntity<?> listTasks(@RequestParam Optional<String> completed,
                                       @RequestParam Optional<Integer> limit,
                                       @RequestParam Optional<Integer> skip,
                                       Authentication auth) {
        User user = (User) auth.getPrincipal();
        List<Task> tasks;
        if (completed.isPresent()) {
            boolean c = completed.get().equals("true");
            tasks = taskRepo.findByOwnerAndCompleted(user.getId(), c);
        } else {
            tasks = taskRepo.findByOwner(user.getId());
        }
        // Basic skip/limit
        int s = skip.orElse(0);
        int l = limit.orElse(tasks.size());
        tasks = tasks.stream().skip(s).limit(l).toList();
        return ResponseEntity.ok(tasks);
    }

    // ── GET /tasks/:id ────────────────────────────────────────────────────────
    @GetMapping("/tasks/{id}")
    public ResponseEntity<?> getTask(@PathVariable String id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        return taskRepo.findByIdAndOwner(id, user.getId())
                .map(ResponseEntity::ok)
                .<ResponseEntity<?>>map(r -> r)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── PATCH /tasks/:id ──────────────────────────────────────────────────────
    @PatchMapping("/tasks/{id}")
    public ResponseEntity<?> updateTask(@PathVariable String id,
                                        @RequestBody UpdateTaskRequest req,
                                        Authentication auth) {
        User user = (User) auth.getPrincipal();
        Optional<Task> taskOpt = taskRepo.findByIdAndOwner(id, user.getId());
        if (taskOpt.isEmpty()) return ResponseEntity.notFound().build();

        Task task = taskOpt.get();
        boolean wasCompleted = Boolean.TRUE.equals(task.getCompleted());

        if (req.getDescription() != null) task.setDescription(req.getDescription());
        if (req.getCategory()    != null) task.setCategory(req.getCategory());
        if (req.getPriority()    != null) task.setPriority(req.getPriority());
        if (req.getSubtasks()    != null) task.setSubtasks(req.getSubtasks());
        if (req.getDueDate()     != null) task.setDueDate(req.getDueDate());

        if (req.getCompleted() != null) {
            task.setCompleted(req.getCompleted());
            if (req.getCompleted()) {
                task.setCompletedAt(Instant.now());
            } else {
                task.setCompletedAt(null);
            }
        }

        task = taskRepo.save(task);

        // Email on completion
        if (!wasCompleted && Boolean.TRUE.equals(task.getCompleted())) {
            Double days = (task.getCompletedAt() != null && task.getCreatedAt() != null)
                    ? Math.round((task.getCompletedAt().toEpochMilli() - task.getCreatedAt().toEpochMilli())
                      / (1000.0 * 60 * 60 * 24) * 10) / 10.0
                    : null;
            emailService.sendTaskCompletedEmail(user.getEmail(), user.getName(), task.getDescription(), days);
        }

        return ResponseEntity.ok(task);
    }

    // ── DELETE /tasks/:id ─────────────────────────────────────────────────────
    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable String id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Optional<Task> taskOpt = taskRepo.findByIdAndOwner(id, user.getId());
        if (taskOpt.isEmpty()) return ResponseEntity.notFound().build();
        taskRepo.delete(taskOpt.get());
        return ResponseEntity.ok(taskOpt.get());
    }
}
