package com.gaurav.taskmanager.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private String email;
    private String password;
    private Integer age;
}
