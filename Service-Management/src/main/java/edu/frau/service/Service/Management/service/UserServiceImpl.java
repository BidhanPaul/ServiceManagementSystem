package edu.frau.service.Service.Management.service;

import edu.frau.service.Service.Management.model.Role;
import edu.frau.service.Service.Management.model.User;
import edu.frau.service.Service.Management.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PmWhitelistService pmWhitelistService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NotificationService notificationService;

    @Override
    public User register(User user) {

        if (userRepository.existsByUsername(user.getUsername()))
            throw new RuntimeException("Username already exists");

        if (userRepository.existsByEmail(user.getEmail()))
            throw new RuntimeException("Email already registered");

        // ✅ ONLY PM validation via external employee list by EMAIL
        if (user.getRole() == Role.PROJECT_MANAGER) {
            boolean ok = pmWhitelistService.isValidProjectManager(user.getEmail(), null, null);
            if (!ok) {
                throw new RuntimeException(
                        "You are not authorized to register as PROJECT_MANAGER. Use a valid company PM email."
                );
            }
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User saved = userRepository.save(user);

        // 🔔 ADMIN notification
        notificationService.logAdminAction(
                "New user registered: " + saved.getUsername() + " (" + saved.getRole() + ")"
        );

        return saved;
    }

    @Override
    public User login(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(password, user.getPassword()))
            throw new RuntimeException("Invalid username or password");

        return user;
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    @Override
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public Optional<User> getById(UUID id) {
        return userRepository.findById(id);
    }

    @Override
    public User updateUser(UUID id, User updated) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean changed = false;

        if (updated.getUsername() != null && !updated.getUsername().equals(existing.getUsername())) {
            existing.setUsername(updated.getUsername());
            changed = true;
        }

        if (updated.getEmail() != null && !updated.getEmail().equals(existing.getEmail())) {
            existing.setEmail(updated.getEmail());
            changed = true;
        }

        if (updated.getDob() != null && !updated.getDob().equals(existing.getDob())) {
            existing.setDob(updated.getDob());
            changed = true;
        }

        if (updated.getRole() != null && updated.getRole() != existing.getRole()) {
            existing.setRole(updated.getRole());
            changed = true;
        }

        if (updated.getPassword() != null && !updated.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(updated.getPassword()));
            changed = true;
        }

        User saved = userRepository.save(existing);

        if (changed) {
            notificationService.sendToRole(Role.ADMIN, "User updated: " + saved.getUsername());
        }

        return saved;
    }

    @Override
    public boolean deleteById(UUID id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isEmpty()) return false;

        userRepository.deleteById(id);

        // 🔔 ADMIN notification
        notificationService.logAdminAction("User deleted: " + user.get().getUsername());

        return true;
    }
}
