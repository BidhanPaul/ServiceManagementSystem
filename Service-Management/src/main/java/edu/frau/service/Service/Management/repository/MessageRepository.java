package edu.frau.service.Service.Management.repository;

import edu.frau.service.Service.Management.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByThreadKeyOrderBySentAtAsc(String threadKey);

    // all messages where user is either sender or recipient
    List<Message> findBySenderUsernameOrRecipientUsernameOrderBySentAtDesc(String sender, String recipient);

    long countByRecipientUsernameAndReadByRecipientFalse(String username);

    List<Message> findByRecipientUsernameAndReadByRecipientFalseOrderBySentAtAsc(String username);
}
