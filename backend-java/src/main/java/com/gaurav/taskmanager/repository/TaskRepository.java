package com.gaurav.taskmanager.repository;

import com.gaurav.taskmanager.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends MongoRepository<Task, String> {
    List<Task> findByOwner(String owner);
    List<Task> findByOwnerAndCompleted(String owner, Boolean completed);
    Optional<Task> findByIdAndOwner(String id, String owner);
    void deleteByOwner(String owner);
    long countByOwner(String owner);
    long countByOwnerAndCompleted(String owner, Boolean completed);
}
