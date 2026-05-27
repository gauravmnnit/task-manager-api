package com.gaurav.taskmanager.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "tasks")
public class Task {

    @Id
    private String id;

    private String description;
    private Boolean completed = false;
    private Instant completedAt;
    private Instant dueDate;
    private String category;
    private String priority;
    private List<String> subtasks;

    /** Owner user _id — matches Node backend field name */
    private String owner;

    @CreatedDate
    @Field("createdAt")
    private Instant createdAt;

    @LastModifiedDate
    @Field("updatedAt")
    private Instant updatedAt;
}
