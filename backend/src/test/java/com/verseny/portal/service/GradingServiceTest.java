package com.verseny.portal.service;

import com.verseny.portal.dto.GradeDtos.ClassSubjectAverageResponse;
import com.verseny.portal.dto.GradeDtos.GradeCreateRequest;
import com.verseny.portal.dto.GradeDtos.GradeResponse;
import com.verseny.portal.exception.AuthorizationException;
import com.verseny.portal.exception.NotFoundException;
import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Grade;
import com.verseny.portal.model.GradeType;
import com.verseny.portal.model.Role;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.model.Student;
import com.verseny.portal.model.Subject;
import com.verseny.portal.model.SubjectAssignment;
import com.verseny.portal.repository.GradeRepository;
import com.verseny.portal.repository.SchoolClassRepository;
import com.verseny.portal.repository.StudentRepository;
import com.verseny.portal.repository.SubjectAssignmentRepository;
import com.verseny.portal.repository.SubjectRepository;
import com.verseny.portal.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GradingServiceTest {

    @Mock GradeRepository grades;
    @Mock StudentRepository students;
    @Mock SubjectAssignmentRepository assignments;
    @Mock SubjectRepository subjects;
    @Mock SchoolClassRepository classes;
    @Mock CurrentUser currentUser;
    @InjectMocks GradingService service;

    AppUser teacher;
    AppUser otherTeacher;
    AppUser admin;
    SchoolClass classA;
    SchoolClass classB;
    Subject matek;
    Student studentA;
    SubjectAssignment assignmentInA;

    @BeforeEach
    void setup() {
        teacher = AppUser.builder().id(1L).email("t@p.hu").fullName("Tanár").role(Role.OKTATO).build();
        otherTeacher = AppUser.builder().id(2L).email("o@p.hu").fullName("Más Tanár").role(Role.OKTATO).build();
        admin = AppUser.builder().id(3L).email("a@p.hu").fullName("Admin").role(Role.ADMIN).build();

        classA = SchoolClass.builder().id(10L).startYear(2024).identifier("A").build();
        classB = SchoolClass.builder().id(11L).startYear(2024).identifier("B").build();
        matek = Subject.builder().id(20L).name("Matematika").build();

        AppUser studentUser = AppUser.builder().id(30L).email("s@p.hu").fullName("Diák").role(Role.HALLGATO).build();
        studentA = Student.builder().id(40L).user(studentUser).schoolClass(classA).build();
        assignmentInA = SubjectAssignment.builder()
                .id(50L).schoolClass(classA).subject(matek).teacher(teacher).year(2026).build();
    }

    @Test
    void create_oktatoOnOwnAssignment_succeeds() {
        when(currentUser.require()).thenReturn(teacher);
        when(students.findById(40L)).thenReturn(Optional.of(studentA));
        when(assignments.findById(50L)).thenReturn(Optional.of(assignmentInA));
        when(grades.save(any(Grade.class))).thenAnswer(inv -> {
            Grade g = inv.getArgument(0);
            g.setId(100L);
            g.setRecordedAt(LocalDateTime.now());
            return g;
        });

        GradeResponse response = service.create(new GradeCreateRequest(
                40L, 50L, 5, GradeType.NORMAL, 1.0, "Szép munka"));

        assertThat(response.value()).isEqualTo(5);
        assertThat(response.recordedByName()).isEqualTo("Tanár");
        verify(grades).save(any(Grade.class));
    }

    @Test
    void create_oktatoOnOtherTeachersAssignment_throwsAuthorization() {
        when(currentUser.require()).thenReturn(otherTeacher);
        when(students.findById(40L)).thenReturn(Optional.of(studentA));
        when(assignments.findById(50L)).thenReturn(Optional.of(assignmentInA));

        assertThatThrownBy(() -> service.create(new GradeCreateRequest(
                40L, 50L, 5, GradeType.NORMAL, 1.0, null)))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("own assignments");
        verify(grades, never()).save(any());
    }

    @Test
    void create_studentNotInAssignmentClass_throwsAuthorization() {
        AppUser studentBUser = AppUser.builder().id(31L).email("sb@p.hu").fullName("Diák B").role(Role.HALLGATO).build();
        Student studentB = Student.builder().id(41L).user(studentBUser).schoolClass(classB).build();
        when(currentUser.require()).thenReturn(teacher);
        when(students.findById(41L)).thenReturn(Optional.of(studentB));
        when(assignments.findById(50L)).thenReturn(Optional.of(assignmentInA));

        assertThatThrownBy(() -> service.create(new GradeCreateRequest(
                41L, 50L, 4, GradeType.NORMAL, 1.0, null)))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("not in the class");
        verify(grades, never()).save(any());
    }

    @Test
    void create_unknownStudent_throwsNotFound() {
        when(currentUser.require()).thenReturn(teacher);
        when(students.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(new GradeCreateRequest(
                404L, 50L, 5, GradeType.NORMAL, 1.0, null)))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Student");
    }

    @Test
    void update_ownGrade_modifiesFields() {
        Grade existing = Grade.builder().id(200L).student(studentA).assignment(assignmentInA)
                .value(3).type(GradeType.NORMAL).weight(1.0).recordedBy(teacher)
                .recordedAt(LocalDateTime.now()).build();
        when(grades.findById(200L)).thenReturn(Optional.of(existing));
        when(currentUser.require()).thenReturn(teacher);
        when(grades.save(existing)).thenReturn(existing);

        service.update(200L, new com.verseny.portal.dto.GradeDtos.GradeUpdateRequest(
                4, GradeType.MIDTERM, 2.0, "új komment"));

        assertThat(existing.getValue()).isEqualTo(4);
        assertThat(existing.getType()).isEqualTo(GradeType.MIDTERM);
        assertThat(existing.getWeight()).isEqualTo(2.0);
        assertThat(existing.getComment()).isEqualTo("új komment");
    }

    @Test
    void update_othersGrade_throwsAuthorization() {
        Grade foreignGrade = Grade.builder().id(201L).student(studentA).assignment(assignmentInA)
                .value(3).type(GradeType.NORMAL).weight(1.0).recordedBy(teacher)
                .recordedAt(LocalDateTime.now()).build();
        when(grades.findById(201L)).thenReturn(Optional.of(foreignGrade));
        when(currentUser.require()).thenReturn(otherTeacher);

        assertThatThrownBy(() -> service.update(201L, new com.verseny.portal.dto.GradeDtos.GradeUpdateRequest(
                4, GradeType.NORMAL, 1.0, null)))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("modify own grades");
    }

    @Test
    void delete_adminCanDeleteAny() {
        Grade g = Grade.builder().id(300L).student(studentA).assignment(assignmentInA)
                .value(3).type(GradeType.NORMAL).weight(1.0).recordedBy(teacher)
                .recordedAt(LocalDateTime.now()).build();
        when(grades.findById(300L)).thenReturn(Optional.of(g));
        when(currentUser.require()).thenReturn(admin);

        service.delete(300L);

        verify(grades).delete(g);
    }

    @Test
    void delete_oktatoCannotDeleteOthersGrade_throws() {
        Grade g = Grade.builder().id(301L).student(studentA).assignment(assignmentInA)
                .value(3).type(GradeType.NORMAL).weight(1.0).recordedBy(teacher)
                .recordedAt(LocalDateTime.now()).build();
        when(grades.findById(301L)).thenReturn(Optional.of(g));
        when(currentUser.require()).thenReturn(otherTeacher);

        assertThatThrownBy(() -> service.delete(301L))
                .isInstanceOf(AuthorizationException.class)
                .hasMessageContaining("delete own");
        verify(grades, never()).delete(any());
    }

    @Test
    void classSubjectAverage_computesWeightedAveragePerStudent() {
        when(classes.findById(10L)).thenReturn(Optional.of(classA));
        when(subjects.findById(20L)).thenReturn(Optional.of(matek));
        Grade g1 = Grade.builder().id(1L).student(studentA).assignment(assignmentInA)
                .value(5).type(GradeType.NORMAL).weight(1.0).recordedBy(teacher)
                .recordedAt(LocalDateTime.now()).build();
        Grade g2 = Grade.builder().id(2L).student(studentA).assignment(assignmentInA)
                .value(3).type(GradeType.MIDTERM).weight(2.0).recordedBy(teacher)
                .recordedAt(LocalDateTime.now()).build();
        when(grades.findByClassAndSubject(classA, matek)).thenReturn(List.of(g1, g2));

        ClassSubjectAverageResponse result = service.classSubjectAverage(10L, 20L);

        // (5*1 + 3*2) / (1 + 2) = 11/3 = 3.6666... rounded to 3.67
        assertThat(result.perStudent()).hasSize(1);
        assertThat(result.perStudent().get(0).weightedAverage()).isEqualTo(3.67);
        assertThat(result.perStudent().get(0).gradeCount()).isEqualTo(2);
        assertThat(result.classWeightedAverage()).isEqualTo(3.67);
        assertThat(result.schoolClassName()).isEqualTo("2024/A");
        assertThat(result.subjectName()).isEqualTo("Matematika");
    }
}
