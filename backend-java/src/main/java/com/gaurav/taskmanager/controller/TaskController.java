package com.gaurav.taskmanager.controller;

import com.gaurav.taskmanager.model.Task;
import com.gaurav.taskmanager.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task task) {
        Task saved = taskRepository.save(task);
        return ResponseEntity.status(201).body(saved);
    }

    @GetMapping
    public List<Task> listTasks() {
        return taskRepository.findAll();
    }
}
