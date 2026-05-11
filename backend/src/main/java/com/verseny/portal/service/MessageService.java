package com.verseny.portal.service;

import com.verseny.portal.dto.MessageDtos.ContactResponse;
import com.verseny.portal.dto.MessageDtos.MessageCreateRequest;
import com.verseny.portal.dto.MessageDtos.MessageResponse;
import com.verseny.portal.dto.MessageDtos.UnreadCountResponse;
import com.verseny.portal.exception.AuthorizationException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Message;
import com.verseny.portal.repository.MessageRepository;
import com.verseny.portal.repository.UserRepository;
import com.verseny.portal.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class MessageService {

    private final MessageRepository messages;
    private final UserRepository users;
    private final CurrentUser currentUser;

    public MessageService(MessageRepository messages, UserRepository users, CurrentUser currentUser) {
        this.messages = messages;
        this.users = users;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> inbox() {
        AppUser me = currentUser.require();
        return messages.findByToUserOrderBySentAtDesc(me).stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> conversationWith(Long otherUserId) {
        AppUser me = currentUser.require();
        AppUser other = users.findById(otherUserId).orElseThrow(() -> NotFoundException.of("User", otherUserId));
        return messages.findConversation(me, other).stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse unreadCount() {
        AppUser me = currentUser.require();
        return new UnreadCountResponse(messages.countByToUserAndReadAtIsNull(me));
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> contacts() {
        AppUser me = currentUser.require();
        return users.findAll().stream()
                .filter(u -> !u.getId().equals(me.getId()))
                .map(u -> new ContactResponse(u.getId(), u.getFullName(), u.getRole().name()))
                .toList();
    }

    public MessageResponse send(MessageCreateRequest req) {
        AppUser me = currentUser.require();
        if (req.toUserId().equals(me.getId())) {
            throw new AuthorizationException("Cannot send a message to yourself");
        }
        AppUser to = users.findById(req.toUserId())
                .orElseThrow(() -> NotFoundException.of("User", req.toUserId()));
        Message m = Message.builder()
                .fromUser(me)
                .toUser(to)
                .body(req.body())
                .build();
        return MessageResponse.from(messages.save(m));
    }

    public MessageResponse markRead(Long messageId) {
        AppUser me = currentUser.require();
        Message m = messages.findById(messageId).orElseThrow(() -> NotFoundException.of("Message", messageId));
        if (m.getToUser() == null || !m.getToUser().getId().equals(me.getId())) {
            throw new AuthorizationException("Only recipient can mark a message as read");
        }
        if (m.getReadAt() == null) {
            m.setReadAt(LocalDateTime.now());
            messages.save(m);
        }
        return MessageResponse.from(m);
    }
}
