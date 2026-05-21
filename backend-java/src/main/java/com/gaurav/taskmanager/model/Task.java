package com.gaurav.taskmanager.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "tasks")
public class Task {
    @Id
    private String id;
    private String description;
    private Boolean completed = false;
    private String owner; // user id
}
