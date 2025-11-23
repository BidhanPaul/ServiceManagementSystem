package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.Role;
import edu.frau.service.Service.Management.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    long countByRole(Role role);
    List<User> findByRole(Role role);

}
