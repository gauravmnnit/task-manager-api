package com.gaurav.taskmanager.controller;

import com.gaurav.taskmanager.model.User;
import com.gaurav.taskmanager.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import com.gaurav.taskmanager.util.JwtUtil;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping
    public ResponseEntity<?> register(@Validated @RequestBody User user) {
        // basic check
        Optional<User> existing = userRepository.findByEmail(user.getEmail());
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("Email already in use");
        }
        // hash password
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);

        // generate JWT token
        String secret = System.getenv().getOrDefault("JWT_SECRET", "thisismynewcourse");
        JwtUtil jwtUtil = new JwtUtil(secret, 1000L * 60 * 60 * 24 * 7); // 7 days
        String token = jwtUtil.generateToken(saved.getId() == null ? saved.getEmail() : saved.getId());

        // return shape similar to original API: { user, token }
        return ResponseEntity.ok(new java.util.HashMap<String, Object>() {{
            put("user", saved);
            put("token", token);
        }});
    }
}
