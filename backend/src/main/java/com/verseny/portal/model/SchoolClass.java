package com.verseny.portal.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "school_class", uniqueConstraints = {
        @UniqueConstraint(name = "uk_school_class_year_identifier", columnNames = {"start_year", "identifier"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SchoolClass {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "start_year", nullable = false)
    private Integer startYear;

    @Column(nullable = false)
    private String identifier;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
