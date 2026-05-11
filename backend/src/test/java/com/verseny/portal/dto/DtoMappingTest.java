package com.verseny.portal.dto;

import com.verseny.portal.dto.SchoolClassDtos.SchoolClassResponse;
import com.verseny.portal.dto.StudentDtos.StudentResponse;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Role;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.model.Student;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class DtoMappingTest {

    @Test
    void schoolClassResponse_buildsDisplayName() {
        SchoolClass c = SchoolClass.builder()
                .id(1L).startYear(2024).identifier("A")
                .createdAt(LocalDateTime.of(2024, 9, 1, 8, 0)).build();

        SchoolClassResponse r = SchoolClassResponse.from(c);

        assertThat(r.displayName()).isEqualTo("2024/A");
        assertThat(r.startYear()).isEqualTo(2024);
        assertThat(r.identifier()).isEqualTo("A");
    }

    @Test
    void studentResponse_flattensUserAndClassFields() {
        AppUser u = AppUser.builder().id(7L).email("s@p.hu").fullName("Diák Nóra").role(Role.HALLGATO).build();
        SchoolClass cls = SchoolClass.builder().id(1L).startYear(2024).identifier("B").build();
        Student s = Student.builder().id(40L).user(u).schoolClass(cls)
                .enrolledAt(LocalDateTime.of(2024, 9, 2, 8, 0)).build();

        StudentResponse r = StudentResponse.from(s);

        assertThat(r.userId()).isEqualTo(7L);
        assertThat(r.email()).isEqualTo("s@p.hu");
        assertThat(r.fullName()).isEqualTo("Diák Nóra");
        assertThat(r.schoolClassId()).isEqualTo(1L);
        assertThat(r.schoolClassName()).isEqualTo("2024/B");
    }
}
