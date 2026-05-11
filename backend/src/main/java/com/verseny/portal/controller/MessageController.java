package com.verseny.portal.controller;

import com.verseny.portal.dto.MessageDtos.ContactResponse;
import com.verseny.portal.dto.MessageDtos.MessageCreateRequest;
import com.verseny.portal.dto.MessageDtos.MessageResponse;
import com.verseny.portal.dto.MessageDtos.UnreadCountResponse;
import com.verseny.portal.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Messaging", description = "Üzenetváltás felhasználók között")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/inbox")
    @Operation(summary = "Saját inbox sentAt DESC")
    public List<MessageResponse> inbox() {
        return messageService.inbox();
    }

    @GetMapping("/with/{userId}")
    @Operation(summary = "Beszélgetés egy másik felhasználóval, sentAt ASC")
    public List<MessageResponse> conversation(@PathVariable Long userId) {
        return messageService.conversationWith(userId);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Olvasatlan üzenetek száma az inboxban")
    public UnreadCountResponse unreadCount() {
        return messageService.unreadCount();
    }

    @GetMapping("/contacts")
    @Operation(summary = "Lehetséges címzettek listája (önmaga nélkül)")
    public List<ContactResponse> contacts() {
        return messageService.contacts();
    }

    @PostMapping
    @Operation(summary = "Új üzenet küldése")
    public ResponseEntity<MessageResponse> send(@Valid @RequestBody MessageCreateRequest req) {
        return ResponseEntity.status(201).body(messageService.send(req));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Üzenet megjelölése olvasottként (csak a címzett)")
    public MessageResponse markRead(@PathVariable Long id) {
        return messageService.markRead(id);
    }
}
