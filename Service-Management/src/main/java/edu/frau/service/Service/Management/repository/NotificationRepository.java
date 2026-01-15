package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.Notification;
import edu.frau.service.Service.Management.model.NotificationCategory;
import edu.frau.service.Service.Management.model.Role;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // ✅ USER FEED: personal notifications (SYSTEM + DIRECT_MESSAGE) + role SYSTEM notifications
    @Query("""
        select n from Notification n
        where
            (n.recipientUsername = :username)
            or (n.recipientRole = :role and n.category = edu.frau.service.Service.Management.model.NotificationCategory.SYSTEM)
        order by n.sentAt desc
    """)
    List<Notification> findUserFeed(@Param("username") String username, @Param("role") Role role);

    // keep your existing ones if you already have them:
    List<Notification> findByRecipientUsernameAndCategoryOrderBySentAtDesc(String username, NotificationCategory category);

    List<Notification> findByRecipientRoleOrderBySentAtDesc(Role role);

    List<Notification> findTop20ByRecipientRoleOrderBySentAtDesc(Role role);

    long countByRecipientUsernameAndReadFalse(String username);
}
