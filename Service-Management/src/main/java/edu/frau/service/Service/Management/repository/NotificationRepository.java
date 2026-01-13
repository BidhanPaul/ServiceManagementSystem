package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.Notification;
import edu.frau.service.Service.Management.model.NotificationCategory;
import edu.frau.service.Service.Management.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientRoleOrderBySentAtDesc(Role role);

    List<Notification> findTop20ByRecipientRoleOrderBySentAtDesc(Role role);

    // ✅ user feed
    List<Notification> findByRecipientUsernameOrderBySentAtDesc(String username);

    // ✅ optional filter by category
    List<Notification> findByRecipientUsernameAndCategoryOrderBySentAtDesc(String username, NotificationCategory category);


    // ✅ NEW: user feed includes:
    //  - messages sent directly to username
    //  - messages sent to their role where recipientUsername is null (role broadcast)
    @Query("""
        select n from Notification n
        where (n.recipientUsername = :username)
           or (n.recipientRole = :role and (n.recipientUsername is null or n.recipientUsername = ''))
        order by n.sentAt desc
    """)
    List<Notification> findUserFeed(@Param("username") String username, @Param("role") Role role);

    // ✅ unread count (sidebar badge)
    long countByRecipientUsernameAndReadFalse(String username);
}
