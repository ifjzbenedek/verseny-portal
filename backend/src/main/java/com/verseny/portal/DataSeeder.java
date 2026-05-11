package com.verseny.portal;

import com.verseny.portal.model.AppUser;
import com.verseny.portal.model.Course;
import com.verseny.portal.model.Event;
import com.verseny.portal.model.Grade;
import com.verseny.portal.model.GradeType;
import com.verseny.portal.model.Message;
import com.verseny.portal.model.Role;
import com.verseny.portal.model.SchoolClass;
import com.verseny.portal.model.Student;
import com.verseny.portal.model.Subject;
import com.verseny.portal.model.SubjectAssignment;
import com.verseny.portal.repository.CourseRepository;
import com.verseny.portal.repository.EventRepository;
import com.verseny.portal.repository.GradeRepository;
import com.verseny.portal.repository.MessageRepository;
import com.verseny.portal.repository.SchoolClassRepository;
import com.verseny.portal.repository.StudentRepository;
import com.verseny.portal.repository.SubjectAssignmentRepository;
import com.verseny.portal.repository.SubjectRepository;
import com.verseny.portal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String DEFAULT_PASSWORD = "password";

    @Bean
    public CommandLineRunner seed(UserRepository users,
                                  CourseRepository courses,
                                  SchoolClassRepository classes,
                                  StudentRepository students,
                                  SubjectRepository subjects,
                                  SubjectAssignmentRepository assignments,
                                  GradeRepository grades,
                                  EventRepository events,
                                  MessageRepository messages,
                                  JdbcTemplate jdbc,
                                  PasswordEncoder enc) {
        return args -> {
            // --- Reconcile enum CHECK constraints (ddl-auto:update doesn't update them) ---
            reconcileEnumCheckConstraints(jdbc);

            // --- Users ---
            AppUser admin = ensureUser(users, enc, "admin@portal.hu", "Admin Felhasználó", Role.ADMIN);
            AppUser superadmin = ensureUser(users, enc, "superadmin@portal.hu", "Szuperadmin", Role.SUPERADMIN);
            AppUser sampleTeacher = ensureUser(users, enc, "oktato@portal.hu", "Dr. Példa Oktató", Role.OKTATO);
            AppUser matekTanar = ensureUser(users, enc, "matek.tanar@portal.hu", "Dr. Matek Tanár", Role.OKTATO);
            AppUser tortiTanar = ensureUser(users, enc, "tortenelem.tanar@portal.hu", "Dr. Történelem Tanár", Role.OKTATO);

            AppUser sampleStudentUser = ensureUser(users, enc, "hallgato@portal.hu", "Példa Hallgató", Role.HALLGATO);
            AppUser studentA1 = ensureUser(users, enc, "diak.a1@portal.hu", "Kovács Anna", Role.HALLGATO);
            AppUser studentA2 = ensureUser(users, enc, "diak.a2@portal.hu", "Nagy Béla", Role.HALLGATO);
            AppUser studentB1 = ensureUser(users, enc, "diak.b1@portal.hu", "Szabó Csilla", Role.HALLGATO);
            AppUser studentB2 = ensureUser(users, enc, "diak.b2@portal.hu", "Tóth Dávid", Role.HALLGATO);

            // --- Legacy course sample ---
            if (courses.count() == 0) {
                courses.save(Course.builder()
                        .code("VIMIAB00").title("Szoftvertechnikák")
                        .description("Modern szoftverfejlesztési módszerek.")
                        .credits(5).instructor(sampleTeacher).build());
                courses.save(Course.builder()
                        .code("VIMIAC04").title("Webfejlesztés")
                        .description("Frontend és backend technológiák.")
                        .credits(4).instructor(sampleTeacher).build());
            }

            // --- Classes ---
            SchoolClass classA = ensureClass(classes, 2024, "A");
            SchoolClass classB = ensureClass(classes, 2024, "B");

            // --- Students ---
            ensureStudent(students, sampleStudentUser, classA);
            ensureStudent(students, studentA1, classA);
            ensureStudent(students, studentA2, classA);
            ensureStudent(students, studentB1, classB);
            ensureStudent(students, studentB2, classB);

            // --- Subjects ---
            Subject matek = ensureSubject(subjects, "Matematika",
                    "Algebra, geometria, analízis alapok.",
                    "Sokszínű matematika 12.",
                    "[{\"week\":1,\"topic\":\"Halmazok\"},{\"week\":2,\"topic\":\"Függvények\"}]");
            Subject torti = ensureSubject(subjects, "Történelem",
                    "Magyar és egyetemes történelem a 20. században.",
                    "Történelem 12.",
                    "[{\"week\":1,\"topic\":\"Trianon\"},{\"week\":2,\"topic\":\"II. világháború\"}]");
            Subject magyar = ensureSubject(subjects, "Magyar nyelv",
                    "Nyelvtan, irodalom, fogalmazás.",
                    "Magyar irodalom 12.",
                    "[{\"week\":1,\"topic\":\"Ady\"},{\"week\":2,\"topic\":\"József Attila\"}]");

            // --- Subject assignments (current year) ---
            int year = LocalDate.now().getYear();
            List<SubjectAssignment> aList = new ArrayList<>();
            aList.add(ensureAssignment(assignments, classA, matek, matekTanar, year));
            aList.add(ensureAssignment(assignments, classA, torti, tortiTanar, year));
            aList.add(ensureAssignment(assignments, classA, magyar, sampleTeacher, year));
            aList.add(ensureAssignment(assignments, classB, matek, matekTanar, year));
            aList.add(ensureAssignment(assignments, classB, torti, tortiTanar, year));
            aList.add(ensureAssignment(assignments, classB, magyar, sampleTeacher, year));

            // --- Grades ---
            if (grades.count() == 0) {
                Random rnd = new Random(42);
                GradeType[] types = GradeType.values();
                List<Student> all = students.findAll();
                for (Student s : all) {
                    for (SubjectAssignment a : aList) {
                        if (!a.getSchoolClass().getId().equals(s.getSchoolClass().getId())) continue;
                        int howMany = 1 + rnd.nextInt(2); // 1-2 grade per student per subject
                        for (int i = 0; i < howMany; i++) {
                            GradeType t = types[rnd.nextInt(types.length)];
                            double weight = switch (t) {
                                case MIDTERM, HALFYEAR -> 2.0;
                                case YEAR_END -> 3.0;
                                default -> 1.0;
                            };
                            grades.save(Grade.builder()
                                    .student(s)
                                    .assignment(a)
                                    .value(2 + rnd.nextInt(4)) // 2..5
                                    .type(t)
                                    .weight(weight)
                                    .comment(null)
                                    .recordedBy(a.getTeacher())
                                    .build());
                        }
                    }
                }
            }

            // --- Events ---
            ensureEvent(events, admin, "Tanévzáró", "Az iskolaév hivatalos lezárása.",
                    LocalDateTime.of(2026, 6, 15, 10, 0), null, "Iskolai aula", 47.4731, 19.0598);
            ensureEvent(events, admin, "Szülői értekezlet",
                    "Aktuális tájékoztató minden osztály szülei számára.",
                    LocalDateTime.of(2026, 5, 20, 18, 0), null, "Osztálytermek", 47.4731, 19.0598);
            ensureEvent(events, admin, "Sportnap", "Játékos vetélkedő és csapatsportok.",
                    LocalDateTime.of(2026, 5, 25, 9, 0), null, "Sportpálya", 47.4733, 19.0605);

            // --- Sample messages ---
            if (messages.count() == 0) {
                ensureMessage(messages, sampleStudentUser, sampleTeacher,
                        "Tanár Úr, érdeklődnék a holnapi dolgozat témakörei felől.",
                        LocalDateTime.now().minusDays(2), true);
                ensureMessage(messages, sampleTeacher, sampleStudentUser,
                        "Szia, a teljes második fejezet jön, plusz egy könnyebb függvény-feladat.",
                        LocalDateTime.now().minusDays(2).plusHours(1), false);
                ensureMessage(messages, sampleTeacher, sampleStudentUser,
                        "Ha bármi nem világos, írj nyugodtan!",
                        LocalDateTime.now().minusHours(5), false);
                ensureMessage(messages, admin, sampleTeacher,
                        "Kedves Kollega, a holnapi értekezlet 15:00-kor lesz a tanáriban.",
                        LocalDateTime.now().minusHours(3), false);
            }

            log.info("DataSeeder finished. Users={}, classes={}, students={}, subjects={}, assignments={}, grades={}, events={}, messages={}",
                    users.count(), classes.count(), students.count(), subjects.count(), assignments.count(),
                    grades.count(), events.count(), messages.count());
            // referenced to avoid IDE warnings; the variables capture the seeded admins
            log.debug("Seeded admins: {} / {}", admin.getEmail(), superadmin.getEmail());
        };
    }

    private void reconcileEnumCheckConstraints(JdbcTemplate jdbc) {
        try {
            jdbc.execute("ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_role_check");
        } catch (Exception ignored) {
            // Table may not exist yet on a fresh DB — Hibernate will create it with the right values.
        }
        try {
            jdbc.execute("ALTER TABLE grade DROP CONSTRAINT IF EXISTS grade_type_check");
        } catch (Exception ignored) {
            // First-run: table not yet present.
        }
    }

    private AppUser ensureUser(UserRepository users, PasswordEncoder enc, String email, String fullName, Role role) {
        return users.findByEmail(email).orElseGet(() -> users.save(AppUser.builder()
                .email(email)
                .passwordHash(enc.encode(DEFAULT_PASSWORD))
                .fullName(fullName)
                .role(role)
                .build()));
    }

    private SchoolClass ensureClass(SchoolClassRepository classes, int year, String identifier) {
        return classes.findByStartYearAndIdentifier(year, identifier)
                .orElseGet(() -> classes.save(SchoolClass.builder()
                        .startYear(year)
                        .identifier(identifier)
                        .build()));
    }

    private Student ensureStudent(StudentRepository students, AppUser user, SchoolClass cls) {
        return students.findByUser(user)
                .orElseGet(() -> students.save(Student.builder().user(user).schoolClass(cls).build()));
    }

    private Subject ensureSubject(SubjectRepository subjects, String name, String description,
                                  String requiredBook, String lessonsJson) {
        return subjects.findAll().stream()
                .filter(s -> name.equals(s.getName()))
                .findFirst()
                .orElseGet(() -> subjects.save(Subject.builder()
                        .name(name)
                        .description(description)
                        .requiredBook(requiredBook)
                        .lessonsJson(lessonsJson)
                        .build()));
    }

    private void ensureMessage(MessageRepository messages, AppUser from, AppUser to,
                                String body, LocalDateTime sentAt, boolean alreadyRead) {
        Message m = Message.builder()
                .fromUser(from)
                .toUser(to)
                .body(body)
                .sentAt(sentAt)
                .readAt(alreadyRead ? sentAt.plusMinutes(10) : null)
                .build();
        messages.save(m);
    }

    private SubjectAssignment ensureAssignment(SubjectAssignmentRepository assignments,
                                               SchoolClass cls, Subject subject, AppUser teacher, int year) {
        return assignments.findBySchoolClassAndYear(cls, year).stream()
                .filter(a -> a.getSubject().getId().equals(subject.getId()))
                .findFirst()
                .orElseGet(() -> assignments.save(SubjectAssignment.builder()
                        .schoolClass(cls)
                        .subject(subject)
                        .teacher(teacher)
                        .year(year)
                        .build()));
    }

    private Event ensureEvent(EventRepository events, AppUser createdBy, String title, String description,
                              LocalDateTime startAt, LocalDateTime endAt, String location,
                              Double latitude, Double longitude) {
        return events.findAllByOrderByStartAtAsc().stream()
                .filter(e -> title.equals(e.getTitle()) && startAt.equals(e.getStartAt()))
                .findFirst()
                .orElseGet(() -> events.save(Event.builder()
                        .title(title)
                        .description(description)
                        .startAt(startAt)
                        .endAt(endAt)
                        .location(location)
                        .latitude(latitude)
                        .longitude(longitude)
                        .createdBy(createdBy)
                        .build()));
    }
}
