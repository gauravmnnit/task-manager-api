package com.gaurav.taskmanager.controller;

import com.gaurav.taskmanager.dto.*;
import com.gaurav.taskmanager.model.User;
import com.gaurav.taskmanager.repository.TaskRepository;
import com.gaurav.taskmanager.repository.UserRepository;
import com.gaurav.taskmanager.service.EmailService;
import com.gaurav.taskmanager.util.JwtUtil;
import jakarta.validation.Valid;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired private UserRepository userRepo;
    @Autowired private TaskRepository taskRepo;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;

    // ── POST /users — register ────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }
        if (req.getPassword().contains("password")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password should not include \"password\""));
        }
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setAge(req.getAge());
        user = userRepo.save(user);

        String token = jwtUtil.generateToken(user.getId());
        user.getTokens().add(token);
        userRepo.save(user);

        emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        return ResponseEntity.status(201).body(new AuthResponse(user, token));
    }

    // ── POST /users/login ─────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Optional<User> userOpt = userRepo.findByEmail(req.getEmail().toLowerCase().trim());
        if (userOpt.isEmpty() || !passwordEncoder.matches(req.getPassword(), userOpt.get().getPassword())) {
            return ResponseEntity.status(400).body(Map.of("error", "Unable to login!"));
        }
        User user = userOpt.get();
        String token = jwtUtil.generateToken(user.getId());
        user.getTokens().add(token);
        userRepo.save(user);
        return ResponseEntity.ok(new AuthResponse(user, token));
    }

    // ── POST /users/logout ────────────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication auth) {
        User user = (User) auth.getPrincipal();
        String token = (String) auth.getCredentials();
        user.getTokens().remove(token);
        userRepo.save(user);
        return ResponseEntity.ok().build();
    }

    // ── POST /users/logoutALL ─────────────────────────────────────────────────
    @PostMapping("/logoutALL")
    public ResponseEntity<?> logoutAll(Authentication auth) {
        User user = (User) auth.getPrincipal();
        user.getTokens().clear();
        userRepo.save(user);
        return ResponseEntity.ok().build();
    }

    // ── GET /users/me ─────────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication auth) {
        return ResponseEntity.ok(auth.getPrincipal());
    }

    // ── PATCH /users/me ───────────────────────────────────────────────────────
    @PatchMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody UpdateUserRequest req, Authentication auth) {
        User user = (User) auth.getPrincipal();
        if (req.getName()     != null) user.setName(req.getName());
        if (req.getEmail()    != null) user.setEmail(req.getEmail().toLowerCase().trim());
        if (req.getAge()      != null) user.setAge(req.getAge());
        if (req.getPassword() != null) {
            if (req.getPassword().contains("password")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password should not include \"password\""));
            }
            if (req.getPassword().length() < 7) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 7 characters"));
            }
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        userRepo.save(user);
        return ResponseEntity.ok(user);
    }

    // ── DELETE /users/me ──────────────────────────────────────────────────────
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteMe(Authentication auth) {
        User user = (User) auth.getPrincipal();
        taskRepo.deleteByOwner(user.getId());
        userRepo.delete(user);
        emailService.sendByeEmail(user.getEmail(), user.getName());
        return ResponseEntity.ok(user);
    }

    // ── POST /users/me/avatar ─────────────────────────────────────────────────
    @PostMapping("/me/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("avatar") MultipartFile file,
                                          Authentication auth) {
        try {
            if (!file.getOriginalFilename().matches(".*\\.(jpg|jpeg|png)$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please upload jpg, jpeg or png file type"));
            }
            if (file.getSize() > 1_000_000) {
                return ResponseEntity.badRequest().body(Map.of("error", "File too large (max 1 MB)"));
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Thumbnails.of(new ByteArrayInputStream(file.getBytes()))
                    .size(250, 250)
                    .outputFormat("png")
                    .toOutputStream(baos);

            User user = (User) auth.getPrincipal();
            user.setAvatar(baos.toByteArray());
            userRepo.save(user);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── DELETE /users/me/avatar ───────────────────────────────────────────────
    @DeleteMapping("/me/avatar")
    public ResponseEntity<?> deleteAvatar(Authentication auth) {
        User user = (User) auth.getPrincipal();
        user.setAvatar(null);
        userRepo.save(user);
        return ResponseEntity.ok().build();
    }

    // ── GET /users/:id/avatar ─────────────────────────────────────────────────
    @GetMapping("/{id}/avatar")
    public ResponseEntity<byte[]> getAvatar(@PathVariable String id) {
        return userRepo.findById(id)
                .filter(u -> u.getAvatar() != null)
                .map(u -> ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(u.getAvatar()))
                .orElse(ResponseEntity.notFound().build());
    }
}
