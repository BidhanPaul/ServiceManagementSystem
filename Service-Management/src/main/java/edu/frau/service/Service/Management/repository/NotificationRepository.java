// src/main/java/edu/frau/service/Service/Management/repository/NotificationRepository.java
package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.Notification;
import edu.frau.service.Service.Management.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // All notifications for a role (newest first)
    List<Notification> findByRecipientRoleOrderBySentAtDesc(Role role);

    // Only last N (here 20) for a role
    List<Notification> findTop20ByRecipientRoleOrderBySentAtDesc(Role role);
    List<Notification> findTop20ByOrderBySentAtDesc();
}
