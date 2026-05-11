package com.verseny.portal.dto;

import com.verseny.portal.model.Event;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class EventDtos {

    public record EventResponse(
            Long id,
            String title,
            String description,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String location,
            String createdByFullName,
            LocalDateTime createdAt
    ) {
        public static EventResponse from(Event e) {
            return new EventResponse(
                    e.getId(),
                    e.getTitle(),
                    e.getDescription(),
                    e.getStartAt(),
                    e.getEndAt(),
                    e.getLocation(),
                    e.getCreatedBy() == null ? null : e.getCreatedBy().getFullName(),
                    e.getCreatedAt()
            );
        }
    }

    public record EventCreateRequest(
            @NotBlank @Size(max = 255) String title,
            @Size(max = 2000) String description,
            @NotNull LocalDateTime startAt,
            LocalDateTime endAt,
            @Size(max = 255) String location
    ) {}
}
