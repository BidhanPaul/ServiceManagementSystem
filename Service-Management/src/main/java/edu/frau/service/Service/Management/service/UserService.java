package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.User;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserService {

    User register(User user);
    User login(String username, String password);
    User findByUsername(String username);
    List<User> findAllUsers();

    // Admin controls
    Optional<User> getById(UUID id);
    User updateUser(UUID id, User user);
    boolean deleteById(UUID id);
}
