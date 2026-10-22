package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.User;
import edu.frau.service.Service.Management.dto.UserResponseDTO;
import edu.frau.service.Service.Management.dto.UserUpdateRequest;
import edu.frau.service.Service.Management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // Get all users (Admin use)
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllUsers().stream().map(UserResponseDTO::from).toList());
    }

    // Get single user by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id) {
        return userService.getById(id)
                .map(UserResponseDTO::from)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update user (Admin)
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable UUID id, @RequestBody UserUpdateRequest request) {
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setDob(request.dob());
        user.setPassword(request.password());
        user.setRole(request.role());
        return ResponseEntity.ok(UserResponseDTO.from(userService.updateUser(id, user)));
    }



    // Delete user (Admin)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        boolean deleted = userService.deleteById(id);
        return deleted
                ? ResponseEntity.ok("User deleted")
                : ResponseEntity.notFound().build();
    }

    // Lookup by username
    @GetMapping("/find/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        User user = userService.findByUsername(username);
        return user == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.ok(UserResponseDTO.from(user));
    }
}
