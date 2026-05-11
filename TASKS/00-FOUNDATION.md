# 00 — FOUNDATION (szekvenciális, ELSŐKÉNT)

> **Ezt a brief-et a többi ablak ELŐTT le kell futtatni.** A párhuzamos ablakok erre az alapra fognak építeni.

## Cél

Hozd létre a feladatkiírás kötelező adatmodelljét (Class, Student, Subject, SubjectAssignment, Grade) a meglévő Spring Boot backend-en, alap CRUD endpointokkal, role-based jogosultsággal, frissített DataSeederrel. Documentáld az API-t (OpenAPI).

## Kontextus

A repo gyökerében: `backend/` (Spring Boot 3.2.5, Java 17, JWT, jjwt 0.12.5), `frontend/` (React + Vite + TS), `docker-compose.yml` (Postgres). Részletes terv: [TERV.md](../TERV.md). Általános kontextus: [CLAUDE.md](../CLAUDE.md).

A meglévő backend csomag: `com.verseny.portal`. A meglévő minta: `Course` entity (model + repository + controller). Roles: `ADMIN`, `OKTATO`, `HALLGATO`.

## Branch

```powershell
git checkout -b feat/foundation
```

## Tulajdonolt fájlok

- `backend/src/main/java/com/verseny/portal/` (kibővíted)
- `backend/src/main/resources/application.yml` (frissíthető)
- `backend/pom.xml` (függőség hozzáadás)

## Deliverables

### 1. Role enum bővítése

`backend/src/main/java/com/verseny/portal/model/Role.java`:
```java
public enum Role {
    HALLGATO, OKTATO, ADMIN, SUPERADMIN
}
```

### 2. Új entitások

Az alábbi entitásokat hozd létre `com.verseny.portal.model` alá (követed a `Course` mintát: Lombok `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`, JPA annotációk):

#### `SchoolClass.java`
- `Long id`
- `Integer startYear` (pl. 2009)
- `String identifier` (pl. "C")
- Unique constraint `(startYear, identifier)`
- `LocalDateTime createdAt`

#### `Student.java`
- `Long id` (külön ID, nem userId mert nem minden user diák)
- `AppUser user` (`@OneToOne`, unique)
- `SchoolClass schoolClass` (`@ManyToOne`)
- `LocalDateTime enrolledAt`

#### `Subject.java`
- `Long id`
- `String name` (nullable=false)
- `String description` (length=2000)
- `String requiredBook`
- `String lessonsJson` (length=4000, JSON formátum a leckékhez)
- `LocalDateTime createdAt`

#### `SubjectAssignment.java`
- `Long id`
- `SchoolClass schoolClass` (`@ManyToOne`)
- `Subject subject` (`@ManyToOne`)
- `AppUser teacher` (`@ManyToOne`, role=OKTATO)
- `Integer year` (pl. 2025)
- Unique constraint `(schoolClass, subject, year)`

#### `Grade.java`
- `Long id`
- `Student student` (`@ManyToOne`)
- `SubjectAssignment assignment` (`@ManyToOne`)
- `Integer value` (1..5, `@Min(1) @Max(5)`)
- `GradeType type` (NORMAL, MIDTERM, HALFYEAR, YEAR_END) — új enum
- `Double weight` (default 1.0)
- `String comment` (length=1000)
- `LocalDateTime recordedAt`
- `AppUser recordedBy` (`@ManyToOne`)
- `@Version Long version` (optimistic lock)

### 3. Repository-k

`com.verseny.portal.repository` alá:
- `SchoolClassRepository extends JpaRepository<SchoolClass, Long>`
  - `Optional<SchoolClass> findByStartYearAndIdentifier(Integer, String)`
- `StudentRepository extends JpaRepository<Student, Long>`
  - `Optional<Student> findByUser(AppUser)`
  - `List<Student> findBySchoolClass(SchoolClass)`
- `SubjectRepository extends JpaRepository<Subject, Long>`
- `SubjectAssignmentRepository extends JpaRepository<SubjectAssignment, Long>`
  - `List<SubjectAssignment> findByTeacher(AppUser)`
  - `List<SubjectAssignment> findBySchoolClassAndYear(SchoolClass, Integer)`
- `GradeRepository extends JpaRepository<Grade, Long>`
  - `List<Grade> findByStudent(Student)`
  - `List<Grade> findByStudentAndAssignment(Student, SubjectAssignment)`

### 4. DTO-k

`com.verseny.portal.dto` alá. **NE ad vissza Entity-t a REST API-n!** DTO mindenhol.

Minden entity-re:
- `XxxResponse` (output)
- `XxxCreateRequest`, `XxxUpdateRequest` (input)
- Validation annotation-ök: `@NotBlank`, `@NotNull`, `@Min`, `@Max`, `@Size`, `@Email`

Konvertáláshoz: manual static mapper method (pl. `GradeMapper.toResponse(Grade)`), vagy a DTO-n static factory method.

### 5. Controllerek

`com.verseny.portal.controller` alá, alap CRUD + role-based `@PreAuthorize`:

#### `SchoolClassController` — `/api/classes`
- `GET /` (ADMIN, SUPERADMIN, OKTATO)
- `GET /{id}` (ADMIN, SUPERADMIN, OKTATO)
- `POST /` (ADMIN, SUPERADMIN)
- `PUT /{id}` (ADMIN, SUPERADMIN)
- `DELETE /{id}` (ADMIN, SUPERADMIN)
- `GET /{id}/students` (ADMIN, SUPERADMIN, OKTATO)

#### `StudentController` — `/api/students`
- `GET /` (ADMIN, SUPERADMIN, OKTATO) — paginated
- `GET /{id}` (ADMIN, SUPERADMIN, OKTATO, sajat HALLGATO)
- `POST /` (ADMIN, SUPERADMIN)
- `DELETE /{id}` (ADMIN, SUPERADMIN)
- `GET /me` (HALLGATO) — saját adatok

#### `SubjectController` — `/api/subjects`
- `GET /` (mindenki authenticated)
- `GET /{id}` (mindenki authenticated)
- `POST /` (ADMIN, SUPERADMIN)
- `PUT /{id}` (ADMIN, SUPERADMIN)
- `DELETE /{id}` (ADMIN, SUPERADMIN)

#### `SubjectAssignmentController` — `/api/assignments`
- `GET /` (ADMIN, SUPERADMIN) — filterezhető `?year=`, `?classId=`, `?teacherId=`
- `GET /my-teaching` (OKTATO) — saját tanított tárgyak az aktuális évben
- `GET /my-subjects` (HALLGATO) — saját osztály tárgyai az aktuális évben
- `POST /` (ADMIN, SUPERADMIN)
- `DELETE /{id}` (ADMIN, SUPERADMIN)

#### `GradeController` — `/api/grades`
- `GET /me` (HALLGATO) — saját jegyek, opcionálisan `?subjectId=`
- `GET /student/{studentId}` (OKTATO ha az ő tárgya, ADMIN/SUPERADMIN)
- `POST /` (OKTATO, csak a saját assignment-jébe)
- `PUT /{id}` (OKTATO, csak a saját)
- `DELETE /{id}` (OKTATO, csak a saját, ADMIN)
- `GET /class/{classId}/subject/{subjectId}/average` (OKTATO, ADMIN) — súlyozott átlagok

### 6. Globális exception handler

`com.verseny.portal.controller.advice.GlobalExceptionHandler` (`@RestControllerAdvice`):
- `NotFoundException` → 404
- `ValidationException` / `MethodArgumentNotValidException` → 400
- `AccessDeniedException` → 403
- Egyéb `RuntimeException` → 500
- Válaszformátum: RFC 7807 Problem Details:
```json
{
  "type": "about:blank",
  "title": "...",
  "status": 404,
  "detail": "...",
  "instance": "/api/...",
  "traceId": "..."
}
```

### 7. Exception osztályok

`com.verseny.portal.exception` alá:
- `DomainException` (ős)
- `NotFoundException extends DomainException`
- `ConflictException extends DomainException`
- `AuthorizationException extends DomainException`

### 8. Spring Modulith előkészítés

`backend/pom.xml`-be:
```xml
<dependency>
    <groupId>org.springframework.modulith</groupId>
    <artifactId>spring-modulith-starter-core</artifactId>
    <version>1.2.0</version>
</dependency>
<dependency>
    <groupId>org.springframework.modulith</groupId>
    <artifactId>spring-modulith-starter-test</artifactId>
    <version>1.2.0</version>
    <scope>test</scope>
</dependency>
```

**Csak hozzáadod, nem refactorálsz**. A párhuzamos `A` ablak fogja a modul-szerkezetet kialakítani.

### 9. OpenAPI dokumentáció

`backend/pom.xml`-be:
```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.5.0</version>
</dependency>
```

Swagger UI: `http://localhost:8081/swagger-ui.html`. Minden controlleren legyen `@Tag` és minden endpointon `@Operation` annotáció.

### 10. DataSeeder bővítése

A `DataSeeder.java`-ban a 3 user mellé adj hozzá:
- 2 osztály: `2024/A`, `2024/B`
- 2 plusz OKTATO user: `matek.tanar@portal.hu`, `tortenelem.tanar@portal.hu`
- 4 plusz HALLGATO user (2 osztályonként)
- 3 Subject: Matematika, Történelem, Magyar nyelv
- 6 SubjectAssignment (mindkét osztálynak mindhárom tárgy)
- ~20 random Grade különböző type-okkal és weight-ekkel
- 1 SUPERADMIN user: `superadmin@portal.hu`

A seeder idempotens legyen (létezés ellenőrzés `findByEmail`-lel).

### 11. application.yml frissítés

- `server.shutdown: graceful`
- `spring.lifecycle.timeout-per-shutdown-phase: 30s`
- `spring.jpa.open-in-view: false`
- `springdoc.swagger-ui.path: /swagger-ui.html`

### 12. docker-compose.yml minimal módosítás

Adj hozzá egy kommentet a `services:` alá ahova a párhuzamos `C` ablak majd be tudja illeszteni a chatbot service-t:

```yaml
services:
  db:
    ...
  # CHATBOT_SERVICE_PLACEHOLDER — Window C adds chatbot service here

volumes:
  ...
```

### 13. Smoke teszt

`mvn spring-boot:run` indul-e, Swagger UI elérhető-e, létrehozhatók-e az új entitások curl-lel admin tokennel, megjeleníthető-e hallgató saját jegye.

### 14. Commit & push

```powershell
git add .
git commit -m "feat(foundation): add core entities (Class, Student, Subject, SubjectAssignment, Grade), CRUD endpoints, OpenAPI, Spring Modulith dep"
git push -u origin feat/foundation
```

PR a `main`-be, és mergelés után a párhuzamos ablakok ebből az új main-ből branch-elnek.

## Definition of Done

- [ ] Backend buildelődik (`mvn clean install`)
- [ ] `mvn spring-boot:run` hibátlan indulás
- [ ] `http://localhost:8081/swagger-ui.html` mutatja az összes új endpointot
- [ ] `DataSeeder` lefutott, létrejöttek a seed entitások (DB-ben látható)
- [ ] HALLGATO login után `GET /api/grades/me` visszaadja a saját jegyeket
- [ ] OKTATO login után `POST /api/grades` képes új jegyet beírni
- [ ] ADMIN login után CRUD működik osztályra/tárgyra
- [ ] Hibás kérésekre RFC 7807 Problem Details válasz jön
- [ ] Spring Modulith dependency hozzáadva (de NEM strukturált modulokba — azt `A` csinálja)
- [ ] Conventional Commits üzenetek
- [ ] PR merged `main`-be

## Tipp

- A `Course` entity-t **NE töröld** — referencia minta, esetleg később hasznosítható.
- A `findCurrentUser()` helper hasznos lesz a controllerekben (Spring Security `Authentication` → `AppUser`).
- Adatbázis idempotenciához: `spring.jpa.hibernate.ddl-auto: update` egyelőre OK, később Flyway.
