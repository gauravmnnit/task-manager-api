package com.gaurav.taskmanager.dto;

import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data
public class UpdateTaskRequest {
    private String description;
    private Boolean completed;
    private Instant dueDate;
    private String category;
    private String priority;
    private List<String> subtasks;
}
