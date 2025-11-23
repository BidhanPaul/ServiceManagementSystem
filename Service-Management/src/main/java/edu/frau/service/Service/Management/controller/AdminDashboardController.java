package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.Role;
import edu.frau.service.Service.Management.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard/admin")
public class AdminDashboardController {

    private final UserRepository userRepository;

    public AdminDashboardController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalUsers", userRepository.count());
        stats.put("adminUsers", userRepository.countByRole(Role.ADMIN));
        stats.put("projectManagers", userRepository.countByRole(Role.PROJECT_MANAGER));
        stats.put("serviceProviders", userRepository.countByRole(Role.SERVICE_PROVIDER));
        stats.put("procurementOfficers", userRepository.countByRole(Role.PROCUREMENT_OFFICER));

        return stats;
    }
}
