package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.Notification;
import edu.frau.service.Service.Management.model.NotificationCategory;
import edu.frau.service.Service.Management.model.Role;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * USER FEED:
     * - All notifications sent TO the user
     * - PLUS all direct messages SENT BY the user (so sender sees their own messages without creating fake "sender copy")
     * - PLUS role SYSTEM notifications
     */
    @Query("""
        select n from Notification n
        where
            (n.recipientUsername = :username)
            or (n.senderUsername = :username and n.category = edu.frau.service.Service.Management.model.NotificationCategory.DIRECT_MESSAGE)
            or (n.recipientRole = :role and n.category = edu.frau.service.Service.Management.model.NotificationCategory.SYSTEM)
        order by n.sentAt desc
    """)
    List<Notification> findUserFeed(@Param("username") String username, @Param("role") Role role);

    List<Notification> findByRecipientUsernameAndCategoryOrderBySentAtDesc(
            String username,
            NotificationCategory category
    );

    List<Notification> findByRecipientRoleOrderBySentAtDesc(Role role);

    List<Notification> findTop20ByRecipientRoleOrderBySentAtDesc(Role role);

    long countByRecipientUsernameAndReadFalse(String username);
}
