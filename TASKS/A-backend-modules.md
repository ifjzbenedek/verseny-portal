# A — Backend modulok (Spring Modulith + hexagonal)

> **Indulás előtt**: [00-FOUNDATION.md](00-FOUNDATION.md) merged `main`-be. `git pull` a legfrissebbet.

## Cél

A meglévő flat `com.verseny.portal.*` package-eket Spring Modulith stílusú modulokba szervezni, hexagonal layeringgel az új moduloknál. Új feature modulok hozzáadása: `scheduling`, `messaging`, `events`, `assignments`, `groups`, `surveys`. ArchUnit teszttel függőségi szabályok enforce-olása. A meglévő `Course`-t hagyd békén.

## Branch

```powershell
git checkout main
git pull
git checkout -b feat/backend-modules
```

## Tulajdonolt fájlok (kizárólag)

- `backend/src/main/java/com/verseny/portal/` minden új csomag
- `backend/src/test/java/`
- `backend/pom.xml` (függőségek)

## TILOS érinteni

- `frontend/`
- `chatbot/` (Window C)
- `mobile/` (Window D)
- `docker-compose.yml`
- `TERV.md`, `CLAUDE.md`, `TASKS/*`

## Deliverables

### 1. Modul-csomagstruktúra a meglévőre

Reorganizáld a meglévő flat `model/`, `repository/`, `controller/`, `dto/` csomagokat **package-by-feature** szerkezetbe **anélkül**, hogy a `Course`-t mozgatnád:

```
com.verseny.portal/
├── shared/                     ← cross-cutting
│   ├── exception/
│   ├── security/               ← JwtAuthFilter, JwtUtil, SecurityConfig ide
│   ├── web/                    ← GlobalExceptionHandler
│   └── audit/                  ← új: AuditLog entity + AuditService
├── iam/
│   ├── api/
│   ├── domain/                 ← AppUser, Role (entity ITT, nem JPA-független, de NE Spring annotáció a Role-on)
│   ├── application/            ← AuthService
│   ├── infrastructure/
│   │   ├── web/                ← AuthController
│   │   └── persistence/        ← UserRepository
│   └── package-info.java       ← @ApplicationModule
├── account/                    ← Student kezelés
│   ├── api/
│   ├── domain/                 ← Student
│   ├── application/
│   └── infrastructure/
├── academic/
│   ├── api/
│   ├── domain/                 ← SchoolClass, Subject, SubjectAssignment
│   ├── application/
│   └── infrastructure/
├── grading/
│   ├── api/
│   ├── domain/                 ← Grade, GradeType, WeightedAverage VO
│   ├── application/            ← RecordGradeUseCase, CalculateAverageUseCase
│   └── infrastructure/
└── legacy/
    └── course/                 ← a meglévő Course ide (csak átmozgatás, hogy ne keveredjen)
```

### 2. `@ApplicationModule` annotációk

Minden modul `package-info.java`-jába:

```java
@org.springframework.modulith.ApplicationModule(
    allowedDependencies = {"shared", "iam"}
)
package com.verseny.portal.<modul>;
```

Engedélyezett függőségek:
- `shared`: senki nem függ tőle (használhatja mindenki)
- `iam`: csak `shared`-től függ
- `account`: `shared`, `iam`
- `academic`: `shared`, `iam`, `account`
- `grading`: `shared`, `iam`, `account`, `academic`
- A többi új modul: konkrét lista

### 3. Új feature modulok

#### `scheduling`
- `ScheduleSlot` entity: `assignmentId`, `dayOfWeek` (enum), `startTime`, `endTime`, `room`
- `Attendance` entity: `slotId`, `studentId`, `date`, `status` (PRESENT, ABSENT, LATE, EXCUSED)
- `Substitution` entity: `slotId`, `date`, `substituteTeacherId`
- Controller: `GET /api/schedule/my` (saját órarend), `POST /api/schedule/slots` (admin), `POST /api/schedule/attendance` (oktató), `POST /api/schedule/substitutions/search` (oktató — szabad helyettesítő keresés)
- Use case: `FindAvailableSubstitutesUseCase`

#### `messaging`
- `Message` entity: `fromUserId`, `toUserId`, `body`, `sentAt`, `readAt`
- Controller: `GET /api/messages/inbox`, `GET /api/messages/with/{userId}`, `POST /api/messages`, `PATCH /api/messages/{id}/read`
- Polling-alapú (WebSocket-et NEM most)

#### `events`
- `Event` entity: `title`, `description`, `startAt`, `endAt`, `location`, `createdBy`
- `EventAudience` entity: `eventId`, `targetType` (ROLE/CLASS/GROUP/ALL), `targetId`
- Controller: `POST /api/events` (admin), `GET /api/events/visible` (látható nekem)

#### `assignments` (beadandók — NE keverd a SubjectAssignment-tel!)
- `Homework` entity: `subjectAssignmentId`, `title`, `description`, `dueDate`, `maxPoints`
- `Submission` entity: `homeworkId`, `studentId`, `fileUrl`, `submittedAt`, `points`, `feedback`
- File upload egyelőre lokálba (`uploads/` mappa, gitignore-olva), MinIO opcionális
- Controller: `POST /api/homework` (oktató), `POST /api/homework/{id}/submissions` (hallgató, multipart), `PUT /api/submissions/{id}/grade` (oktató — pontok beírása + automatic Grade rekord létrehozás `grading` modulon át)
- Domain event: `SubmissionGradedEvent` → `grading` modul `@ApplicationModuleListener` reagál

#### `groups`
- `StudentGroup` entity: `name`, `subjectId`
- `GroupMember` entity: `groupId`, `studentId`
- `GroupAssignment` entity: `groupId`, `teacherId`, `year`
- Controller: admin CRUD, `GET /api/groups/my` (hallgató/oktató)

#### `surveys`
- `Survey`, `SurveyQuestion`, `SurveyAnswer`, `SurveyTarget` entitások
- Controller: admin CRUD a kérdőívekre, mindenki válaszolhat ha target-ben van

### 4. Domain logika

Példa `grading` modulban (követendő minta):

`grading/domain/model/WeightedAverage.java` (immutable value object):
```java
public record WeightedAverage(double value, int count) {
    public static WeightedAverage of(List<Grade> grades) {
        if (grades.isEmpty()) return new WeightedAverage(0.0, 0);
        double weightedSum = grades.stream()
            .mapToDouble(g -> g.getValue() * g.getWeight()).sum();
        double weightSum = grades.stream()
            .mapToDouble(Grade::getWeight).sum();
        return new WeightedAverage(weightedSum / weightSum, grades.size());
    }
}
```

`grading/application/CalculateAverageUseCase.java`:
```java
@Service
@RequiredArgsConstructor
public class CalculateAverageUseCase {
    private final GradeRepository gradeRepository;

    public WeightedAverage forStudentAndAssignment(Long studentId, Long assignmentId) {
        var grades = gradeRepository.findByStudentIdAndAssignmentId(
            studentId, assignmentId);
        return WeightedAverage.of(grades.stream()
            .filter(g -> g.getType() != GradeType.YEAR_END)
            .toList());
    }
}
```

### 5. ArchUnit teszt

`backend/src/test/java/com/verseny/portal/architecture/ModuleBoundaryTest.java`:

```java
@AnalyzeClasses(packages = "com.verseny.portal")
class ModuleBoundaryTest {

    @ArchTest
    static final ArchRule domain_must_not_depend_on_spring = noClasses()
        .that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAnyPackage(
            "org.springframework..",
            "jakarta.persistence..",
            "jakarta.servlet..");

    @ArchTest
    static final ArchRule controllers_only_in_infrastructure_web = classes()
        .that().areAnnotatedWith(RestController.class)
        .should().resideInAPackage("..infrastructure.web..");

    @ArchTest
    static final ArchRule jpa_entities_only_in_infrastructure_persistence = classes()
        .that().areAnnotatedWith(Entity.class)
        .should().resideInAPackage("..infrastructure.persistence..")
        .orShould().resideInAPackage("..domain..");
}
```

**Tipp**: a meglévő `AppUser`, `Course`, `SchoolClass`, stb. JPA `@Entity`-k átmenetileg a `domain/`-ben lehetnek a `Course` minta miatt — a teszt second `orShould` ezt megengedi. Új modulokban viszont különítsd el a domain modelt és a JPA entity-t.

### 6. Spring Modulith verify teszt

```java
class ModulithStructureTest {
    @Test
    void verifyModuleStructure() {
        ApplicationModules.of(PortalApplication.class).verify();
    }

    @Test
    void writeDocumentation() {
        new Documenter(ApplicationModules.of(PortalApplication.class))
            .writeDocumentation()
            .writeIndividualModulesAsPlantUml();
    }
}
```

A doksi `target/spring-modulith-docs/`-be generálódik — másold át `docs/architecture/` alá.

### 7. Audit log infrastruktúra

`shared/audit/AuditLog` entity: `id`, `userId`, `action`, `entityType`, `entityId`, `payloadJson`, `traceId`, `createdAt`.

`AuditService`: `record(action, entityType, entityId, payload)`. Hívd minden write művelet után a use case-ekben.

### 8. Rate limit a login endpointra

Bucket4j függőség:
```xml
<dependency>
    <groupId>com.bucket4j</groupId>
    <artifactId>bucket4j_jdk17-core</artifactId>
    <version>8.10.1</version>
</dependency>
```

`iam/infrastructure/web/RateLimitFilter`: 5 login/perc/IP.

### 9. OpenAPI: csoportosítás modulonként

`springdoc-openapi` `GroupedOpenApi` bean modulonként:
```java
@Bean
GroupedOpenApi grading() {
    return GroupedOpenApi.builder()
        .group("grading")
        .pathsToMatch("/api/grades/**", "/api/averages/**")
        .build();
}
```

### 10. Tesztek

- **Domain unit teszt**: `WeightedAverage`, `Grade` aggregate invariants — pure Java
- **Integration teszt**: `@SpringBootTest` + Testcontainers Postgres + minimum 1 happy path modulonként
- **JaCoCo plugin**: 70% line coverage gate (build fail alatta — `<haltOnFailure>true`)

### 11. Spotless + Checkstyle

`pom.xml`-be:
```xml
<plugin>
    <groupId>com.diffplug.spotless</groupId>
    <artifactId>spotless-maven-plugin</artifactId>
    <version>2.43.0</version>
    <configuration>
        <java>
            <googleJavaFormat/>
            <removeUnusedImports/>
        </java>
    </configuration>
    <executions>
        <execution>
            <goals><goal>check</goal></goals>
        </execution>
    </executions>
</plugin>
```

### 12. README szekció

A `README.md`-ben adj hozzá egy "Backend architecture" szekciót: modul lista, függőségi gráf (Modulith generált PNG link), futtatás.

## Definition of Done

- [ ] Backend buildelődik, minden teszt zöld
- [ ] `mvn spotless:check` zöld
- [ ] ArchUnit tesztek zöldek
- [ ] Spring Modulith `verify()` zöld
- [ ] JaCoCo coverage >= 70%
- [ ] Swagger UI csoportosítja az endpointokat modulonként
- [ ] DataSeeder kibővítve az új modulok minta-adataival
- [ ] Audit log működik (login eseményt rögzít)
- [ ] Rate limit működik a login-on (6. hívás 429)
- [ ] PR `main`-be, CI zöld

## Conventional Commits példák

```
feat(scheduling): add ScheduleSlot entity and CRUD
feat(grading): add weighted average use case
refactor(iam): move security to hexagonal structure
test(grading): unit test WeightedAverage value object
chore(pom): add Spring Modulith dependency
```
