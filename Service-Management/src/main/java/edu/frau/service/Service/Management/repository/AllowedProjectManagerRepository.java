package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.AllowedProjectManager;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AllowedProjectManagerRepository extends JpaRepository<AllowedProjectManager, Long> {
    Optional<AllowedProjectManager> findByEmailIgnoreCase(String email);
    Optional<AllowedProjectManager> findByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
}
