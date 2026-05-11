package com.verseny.portal.dto;

import com.verseny.portal.model.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class MessageDtos {

    public record MessageResponse(
            Long id,
            Long fromUserId,
            String fromUserName,
            Long toUserId,
            String toUserName,
            String body,
            LocalDateTime sentAt,
            LocalDateTime readAt
    ) {
        public static MessageResponse from(Message m) {
            return new MessageResponse(
                    m.getId(),
                    m.getFromUser() == null ? null : m.getFromUser().getId(),
                    m.getFromUser() == null ? null : m.getFromUser().getFullName(),
                    m.getToUser() == null ? null : m.getToUser().getId(),
                    m.getToUser() == null ? null : m.getToUser().getFullName(),
                    m.getBody(),
                    m.getSentAt(),
                    m.getReadAt()
            );
        }
    }

    public record MessageCreateRequest(
            @NotNull Long toUserId,
            @NotBlank @Size(max = 2000) String body
    ) {}

    public record UnreadCountResponse(long count) {}

    public record ContactResponse(Long id, String fullName, String role) {}
}
