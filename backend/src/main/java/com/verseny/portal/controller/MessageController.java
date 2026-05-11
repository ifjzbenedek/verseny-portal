package com.verseny.portal.controller;

import com.verseny.portal.dto.MessageDtos.*;
import com.verseny.portal.exception.AuthorizationException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Message;
import com.verseny.portal.repository.MessageRepository;
import com.verseny.portal.repository.UserRepository;
import com.verseny.portal.security.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Messaging", description = "Üzenetváltás felhasználók között")
public class MessageController {

    private final MessageRepository messages;
    private final UserRepository users;
    private final CurrentUser currentUser;

    public MessageController(MessageRepository messages, UserRepository users, CurrentUser currentUser) {
        this.messages = messages;
        this.users = users;
        this.currentUser = currentUser;
    }

    @GetMapping("/inbox")
    @Operation(summary = "Saját inbox sentAt DESC")
    public List<MessageResponse> inbox() {
        AppUser me = currentUser.require();
        return messages.findByToUserOrderBySentAtDesc(me).stream()
                .map(MessageResponse::from)
                .toList();
    }

    @GetMapping("/with/{userId}")
    @Operation(summary = "Beszélgetés egy másik felhasználóval, sentAt ASC")
    public List<MessageResponse> conversation(@PathVariable Long userId) {
        AppUser me = currentUser.require();
        AppUser other = users.findById(userId).orElseThrow(() -> NotFoundException.of("User", userId));
        return messages.findConversation(me, other).stream()
                .map(MessageResponse::from)
                .toList();
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Olvasatlan üzenetek száma az inboxban")
    public UnreadCountResponse unreadCount() {
        AppUser me = currentUser.require();
        return new UnreadCountResponse(messages.countByToUserAndReadAtIsNull(me));
    }

    @GetMapping("/contacts")
    @Operation(summary = "Lehetséges címzettek listája (önmaga nélkül)")
    public List<ContactResponse> contacts() {
        AppUser me = currentUser.require();
        return users.findAll().stream()
                .filter(u -> !u.getId().equals(me.getId()))
                .map(u -> new ContactResponse(u.getId(), u.getFullName(), u.getRole().name()))
                .toList();
    }

    @PostMapping
    @Operation(summary = "Új üzenet küldése")
    public ResponseEntity<MessageResponse> send(@Valid @RequestBody MessageCreateRequest req) {
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
        return ResponseEntity.status(201).body(MessageResponse.from(messages.save(m)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Üzenet megjelölése olvasottként (csak a címzett)")
    public MessageResponse markRead(@PathVariable Long id) {
        AppUser me = currentUser.require();
        Message m = messages.findById(id).orElseThrow(() -> NotFoundException.of("Message", id));
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
