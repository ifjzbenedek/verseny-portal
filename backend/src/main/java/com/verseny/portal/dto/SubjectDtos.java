package com.verseny.portal.dto;

import com.verseny.portal.model.Subject;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class SubjectDtos {

    public record SubjectResponse(
            Long id,
            String name,
            String description,
            String requiredBook,
            String lessonsJson,
            LocalDateTime createdAt
    ) {
        public static SubjectResponse from(Subject s) {
            return new SubjectResponse(
                    s.getId(),
                    s.getName(),
                    s.getDescription(),
                    s.getRequiredBook(),
                    s.getLessonsJson(),
                    s.getCreatedAt()
            );
        }
    }

    public record SubjectCreateRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description,
            @Size(max = 255) String requiredBook,
            @Size(max = 4000) String lessonsJson
    ) {}

    public record SubjectUpdateRequest(
            @NotBlank @Size(max = 255) String name,
            @Size(max = 2000) String description,
            @Size(max = 255) String requiredBook,
            @Size(max = 4000) String lessonsJson
    ) {}
}
