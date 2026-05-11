package com.verseny.portal.dto;

import com.verseny.portal.model.SchoolClass;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class SchoolClassDtos {

    public record SchoolClassResponse(
            Long id,
            Integer startYear,
            String identifier,
            String displayName,
            LocalDateTime createdAt
    ) {
        public static SchoolClassResponse from(SchoolClass c) {
            return new SchoolClassResponse(
                    c.getId(),
                    c.getStartYear(),
                    c.getIdentifier(),
                    c.getStartYear() + "/" + c.getIdentifier(),
                    c.getCreatedAt()
            );
        }
    }

    public record SchoolClassCreateRequest(
            @NotNull @Min(1990) @Max(2100) Integer startYear,
            @NotBlank @Size(max = 16) String identifier
    ) {}

    public record SchoolClassUpdateRequest(
            @NotNull @Min(1990) @Max(2100) Integer startYear,
            @NotBlank @Size(max = 16) String identifier
    ) {}
}
