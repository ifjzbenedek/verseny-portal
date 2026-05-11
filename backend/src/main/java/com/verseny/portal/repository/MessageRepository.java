package com.verseny.portal.repository;

import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByToUserOrderBySentAtDesc(AppUser toUser);

    long countByToUserAndReadAtIsNull(AppUser toUser);

    @Query("""
            SELECT m FROM Message m
            WHERE (m.fromUser = :a AND m.toUser = :b)
               OR (m.fromUser = :b AND m.toUser = :a)
            ORDER BY m.sentAt ASC
            """)
    List<Message> findConversation(@Param("a") AppUser a, @Param("b") AppUser b);
}
