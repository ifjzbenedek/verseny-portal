# Modern fullStack és mobil fejlesztői verseny – Megvalósítási terv

## 1. Áttekintés

Oktatásszervezési portál középiskolai felhasználásra. Négy felhasználói szerepkör (Diák, Oktató, Adminisztrátor, Szuper-adminisztrátor), kötelező + opcionális funkciókészlettel, reszponzív webes felülettel és külön natív mobil alkalmazással.

**Időkeret**: ~100 óra (több AI agent párhuzamosan dolgozik, kalendáris idő rövidebb)
**Architektúra**: Modular Monolith (Java) + Chatbot Microservice (Python)
**Cél**: maximum pont minden értékelési szempontban.

## 2. Architektúrális döntés

### Miért Modular Monolith?

A microservice nem clean-code-érdem önmagában. A domain méretéhez **moduláris monolit** illik:

| Szempont | Microservice | Modular Monolith |
|---|---|---|
| Modul határok | Network boundary | Compile-time enforced (Spring Modulith) |
| Cross-module hívás | REST + retry + circuit breaker | Sima method call |
| Tranzakció | Saga / eventual consistency | ACID |
| Deploy | Sok konténer + gateway + bus | 1 konténer |
| Refactor | Boundary áttolása nehéz | IDE rename |
| Hibakeresés | Distributed tracing kell | Stack trace |
| Skálázás | Service-enként | Stateless app horizontálisan |

### Chatbot mint megalapozott microservice-kivétel

| Szempont | Indok |
|---|---|
| Tech stack | Python az AI ökoszisztémához |
| Skálázás | LLM hívás lassú (5-30s), ne blokkolja a monolit thread pool-t |
| Failure isolation | LLM API down ≠ portál down |
| Külső API | Eltérő failure mode, retry stratégia |
| Async | SSE streaming válaszok |

### Skálázás stateless monolittal

```
            ┌──────────────┐
            │ Load Balancer│
            └──────┬───────┘
        ┌─────────┼─────────┐
   ┌────▼───┐ ┌───▼────┐ ┌──▼─────┐
   │ App #1 │ │ App #2 │ │ App #3 │
   └────┬───┘ └───┬────┘ └──┬─────┘
        └─────────┼─────────┘
            ┌────▼─────┐
            │ Postgres │ (+ read replica)
            └──────────┘
```

## 3. Komplett architektúra

```
┌─────────────────────────────────────────────────────────────────┐
│           React Web Frontend  +  React Native (Expo)             │
└─────────┬──────────────────────────────────────┬────────────────┘
          │ REST                                 │ SSE / WS
          │                                      │
┌─────────▼────────────────────┐    ┌────────────▼─────────────┐
│  Modular Monolith (Java)     │    │  Chatbot Service           │
│  Spring Boot 3.x             │    │  Python + FastAPI          │
│  Spring Modulith             │    │  Anthropic SDK + RAG       │
│                              │◄───┤  + tool use                │
│  Modules:                    │JWT │  + chat history (PG)       │
│   - iam                      │    │  + pgvector (embeddings)   │
│   - account                  │    │                            │
│   - academic                 │    │                            │
│   - grading                  │    │                            │
│   - scheduling               │    │                            │
│   - assignments              │    │                            │
│   - messaging                │    │                            │
│   - events                   │    │                            │
│   - groups                   │    │                            │
└─────────┬────────────────────┘    └────────────┬─────────────┘
          │                                      │
          └──────────────────┬───────────────────┘
                             │
                ┌────────────▼────────────┐
                │   Postgres + pgvector   │  (külön schema-k)
                └─────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │   Redis  (cache + RL)   │
                └─────────────────────────┘

       ┌───────────────────────────────────────┐
       │  Observability stack                  │
       │  Prometheus + Grafana + Loki + Tempo  │
       │  OpenTelemetry traces                 │
       └───────────────────────────────────────┘
```

## 4. Tech stack

### Monolit (Java)
- Spring Boot 3.x + Java 21 (virtual threads)
- Spring Modulith (modul határok)
- Spring Security + JWT (RS256, JWKS endpoint)
- JPA + Flyway + PostgreSQL
- Redis (cache + rate limit Bucket4j)
- Maven multi-module
- MapStruct (DTO mapping)
- jakarta.validation
- Lombok korlátozottan (`@Value`, `@RequiredArgsConstructor`)
- ArchUnit (függőségi szabályok)
- Resilience4j (circuit breaker, retry, timeout)
- Spring Cloud Stream (domain events kifelé)
- Testcontainers (integration teszt)
- JaCoCo (coverage)
- Spotless + Checkstyle (code style)
- Micrometer + Prometheus (metrics)
- Logback JSON encoder (structured log)
- OpenTelemetry Java agent

### Chatbot service (Python)
- Python 3.12 + FastAPI
- Anthropic SDK (claude-haiku-4-5-20251001 default, claude-sonnet-4-6 komplex kérdésekre)
- **Prompt caching** a system promptra
- PyJWT (RS256, JWKS fetch a monolittól)
- httpx (monolit hívás)
- SQLAlchemy + Alembic
- pgvector (RAG embeddings)
- sentence-transformers (multilingual-e5-large embed model)
- SSE streaming
- pytest + pytest-asyncio
- ruff (lint + format)
- mypy (strict)
- OpenTelemetry Python

### Frontend (Web)
- React 19 + Vite + TypeScript (strict)
- Tailwind CSS + shadcn/ui (design system)
- TanStack Query (server state)
- Zod (runtime validáció)
- React Hook Form
- React Router
- react-i18next (i18n: HU + EN)
- Feature-folder struktúra
- ESLint + Prettier
- Vitest + React Testing Library
- Playwright (e2e)
- axe-core (a11y CI check)
- Storybook (komponens katalógus)

### Mobile (Expo / React Native)
- Expo SDK 51+
- TypeScript + shared types a webbel
- React Native Paper (UI lib)
- Expo Notifications (push)
- Expo Camera (mobil-specifikus funkció → extra pont)
- Expo Location (mobil-specifikus → extra pont)
- TanStack Query (megosztott a webbel)
- Detox vagy Maestro (e2e)

### Infra & DevOps
- Docker Compose (dev)
- Kubernetes manifest + Helm chart (prod-grade demonstráció)
- GitHub Actions CI (lint + test + coverage gate + Docker build + SBOM + OWASP dep check)
- Prometheus + Grafana (dashboards: API latency, error rate, DB pool, JVM)
- Loki (log aggregation)
- Tempo (distributed tracing)
- pre-commit hooks (Husky + lint-staged)
- Dependabot / Renovate
- Conventional Commits + commitlint
- semantic-release

## 5. Repo struktúra

```
verseny/
├── docker-compose.yml
├── docker-compose.observability.yml
├── README.md
├── TERV.md
├── docs/
│   ├── adr/                          ← Architecture Decision Records
│   │   ├── 0001-modular-monolith.md
│   │   ├── 0002-chatbot-microservice.md
│   │   ├── 0003-jwt-rs256.md
│   │   └── ...
│   ├── api/                          ← OpenAPI export
│   ├── architecture.png              ← C4 diagram
│   └── runbook.md                    ← oncall / üzemeltetés
├── k8s/                              ← Helm chart
│   └── chart/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── release.yml
│   │   └── security-scan.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
├── monolith/
│   ├── pom.xml
│   ├── Dockerfile
│   ├── checkstyle.xml
│   └── src/main/java/.../
│       ├── shared/                   ← security, web, exception, audit, observability
│       ├── iam/
│       │   ├── api/
│       │   ├── domain/
│       │   ├── application/
│       │   └── infrastructure/
│       ├── account/
│       ├── academic/
│       ├── grading/
│       ├── scheduling/
│       ├── assignments/
│       ├── messaging/
│       ├── events/
│       └── groups/
├── chatbot/
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── app/
│       ├── main.py
│       ├── auth/
│       ├── tools/
│       ├── chat/
│       ├── rag/
│       └── persistence/
├── frontend/
│   ├── package.json
│   └── src/
│       ├── features/
│       │   ├── auth/
│       │   ├── grades/
│       │   ├── subjects/
│       │   ├── classes/
│       │   ├── admin/
│       │   ├── chat/
│       │   ├── schedule/
│       │   ├── assignments/
│       │   ├── messaging/
│       │   └── events/
│       ├── shared/
│       └── i18n/
├── mobile/
│   ├── package.json
│   └── src/
└── shared-types/                     ← OpenAPI-ból generált TS típusok (web + mobile)
    └── package.json
```

## 6. Adatmodell

### Kötelező entitások

```
User
  id, email (unique), passwordHash, role, firstName, lastName,
  createdAt, updatedAt, version

Class
  id, startYear, identifier (pl. "C")
  unique(startYear, identifier)

Student
  userId (PK, FK), classId (FK)

Subject
  id, name, description, requiredBook, lessonsJson, createdAt

SubjectAssignment
  id, classId, subjectId, teacherId, year
  unique(classId, subjectId, year)

Grade
  id, studentId, assignmentId, value (1..5), type (NORMAL|MIDTERM|HALFYEAR|YEAR_END),
  weight, comment, recordedAt, recordedBy, version
```

### Opcionális feature entitások

```
ScheduleSlot                     ← órarend
  id, assignmentId, dayOfWeek, startTime, endTime, room

Attendance                       ← jelenlét
  id, slotId, studentId, date, status (PRESENT|ABSENT|LATE|EXCUSED)

Substitution                     ← helyettesítés
  id, slotId, date, substituteTeacherId

Assignment (homework)            ← beadandó
  id, subjectAssignmentId, title, description, dueDate, maxPoints, createdAt

Submission
  id, assignmentId, studentId, fileUrl, submittedAt, points, feedback

Message                          ← üzenetküldés
  id, fromUserId, toUserId, body, sentAt, readAt

Event                            ← iskolai esemény
  id, title, description, startAt, endAt, location, createdBy

EventAudience                    ← target (osztály/szerepkör)
  eventId, targetType, targetId

Group                            ← csoportok (haladó/kezdő, nyelvi)
  id, name, subjectId

GroupMember
  groupId, studentId

GroupAssignment                  ← group ↔ teacher ↔ year
  id, groupId, teacherId, year

Survey                           ← szavazás/kérdőív
  id, title, createdBy, createdAt, closesAt

SurveyQuestion
  id, surveyId, text, type

SurveyAnswer
  id, questionId, userId, value

SurveyTarget                     ← kit céloz
  surveyId, targetType, targetId

AuditLog                         ← cross-cutting
  id, userId, action, entityType, entityId, payloadJson, traceId, createdAt

Notification                     ← in-app
  id, userId, type, title, body, link, readAt, createdAt
```

### Chatbot saját schema

```
chatbot.conversation
  id, userId, startedAt, lastActivityAt

chatbot.message
  id, conversationId, role (user|assistant|tool), content, toolCallJson, createdAt

chatbot.document               ← RAG forrás
  id, title, source, content

chatbot.document_chunk         ← embedding storage
  id, documentId, chunk, embedding (vector(1024))
```

### Indexek (mindenre)

`student.class_id`, `grade.student_id`, `grade.assignment_id`, `subject_assignment.(class_id, year)`, `audit_log.(user_id, created_at)`, `message.(to_user_id, read_at)`, `notification.(user_id, read_at)`, `document_chunk` HNSW index a `embedding`-en.

## 7. Modul belső szerkezete (Hexagonal / Ports & Adapters)

```
<module>/
├── api/                          ← publikus interface más moduloknak
│   ├── XxxApi.java
│   └── dto/
├── domain/                       ← tiszta üzleti logika, framework-mentes
│   ├── model/                    ← Aggregate root, Value object
│   ├── event/                    ← Domain event
│   └── port/                     ← Repository + external service interface
├── application/                  ← use case-ek
│   └── ...UseCase.java
└── infrastructure/               ← adapters
    ├── web/
    └── persistence/
        ├── XxxJpaEntity.java     ← NEM domain model
        ├── XxxJpaRepository.java
        └── XxxRepositoryAdapter.java
```

A domain layer **semmilyen Spring/JPA-t nem importál**. ArchUnit teszt enforce-olja.

## 8. Clean Code elvek

- DDD-light: Aggregate root, Value object, Domain event
- Hexagonal: port a domain-ben, adapter az infrastructure-ben
- Spring Modulith: `@ApplicationModule(allowedDependencies = {...})`
- Controller csak HTTP ↔ use case mapping
- Request DTO ≠ Domain command ≠ Persistence entity ≠ Response DTO
- Globális `@RestControllerAdvice` Problem Details (RFC 7807) válaszformátum
- `@Valid` minden request body-n
- Pagination MINDEN list endpointon (Page DTO, cursor opcionálisan)
- Frontend feature-folder, TanStack Query, Zod
- Strict TS (`strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Immutable domain objects (`record` ahol lehet)
- Null safety (`Optional` return, `Objects.requireNonNull`)
- Exception hierarchy (`DomainException` ős)
- Conventional Commits + commitlint
- Spotless auto-format CI-ban
- Pre-commit hook (Husky) — format + lint + types

## 9. Biztonság

| # | Mit | Hogyan |
|---|---|---|
| 1 | Jelszó hash | BCrypt strength=12 |
| 2 | JWT | Access (15p, RS256) + refresh (httpOnly, SameSite=Strict, 7nap) |
| 3 | JWT key rotation | JWKS endpoint, kulcsok rotálhatók |
| 4 | SQL injection | JPA paraméteres query |
| 5 | XSS | React escape, `dangerouslyInnerHTML` tilos |
| 6 | CSRF | SameSite cookie + double-submit token |
| 7 | CORS | Csak frontend origin, credentials true |
| 8 | Authorization | `@PreAuthorize` minden endpointon, default deny |
| 9 | Method-level security | `@PostAuthorize` adat-szintű ellenőrzésre |
| 10 | Input validation | `@Valid` + custom validators |
| 11 | Output sanitization | Nem visszaadunk hash-t, tokent |
| 12 | Secrets | Docker secrets / `.env` + `.gitignore`; README javasolja Vault-ot |
| 13 | Rate limiting | Bucket4j `/auth/login`, `/auth/refresh`, chatbot endpointon |
| 14 | Security headers | HSTS, X-Frame-Options, CSP, Referrer-Policy, X-Content-Type-Options |
| 15 | Account lockout | 5 sikertelen login → 15p lock |
| 16 | Logging | Sensitive data masking (PII, jelszó, token) — Logback masking layout |
| 17 | Audit log | Minden write művelet → audit_log tábla, kereshetően |
| 18 | Optimistic lock | `@Version` Grade-en, Submission-on |
| 19 | OWASP dep check | CI-ban (Maven plugin) |
| 20 | OWASP ZAP scan | Heti CI job |
| 21 | SBOM | CycloneDX a CI-ban |
| 22 | TLS | Production-ben, README javaslat |
| 23 | Chatbot ↔ monolit | User JWT propagáció, autorizáció a monoliton |
| 24 | LLM prompt injection | System prompt + tool result sanitization |
| 25 | File upload | Type/size validáció, MIME sniffing, AV scan ajánlás |

## 10. Skálázhatóság

- Stateless monolit → load balancer + horizontális
- Saját DB schema modulonként (logikai izoláció)
- Pagination + cursor-based a nagy listákon
- Idempotency keys write endpointokon (`Idempotency-Key` header)
- HikariCP explicit konfig (`maximum-pool-size`, `connection-timeout`)
- Redis cache hot read-eken (`@Cacheable`)
- Indexek (lásd 6.) + FK + optimistic lock
- Chatbot service külön skálázható
- Async domain event (Spring Modulith `@ApplicationModuleListener`)
- Transactional outbox pattern (Spring Modulith built-in)
- DB read replica (production guide a README-ben)
- HTTP/2 + gzip/brotli compression
- Connection pool DB-hez explicit
- Graceful shutdown (`server.shutdown=graceful`)

## 11. Chatbot integráció

```
Frontend ──[JWT]──> Chatbot Service
                       │
                       │ user: "Milyen jegyem van matekból?"
                       │
                       ▼
                   Claude API (tool use + prompt cache)
                       │
                       │ tool_call: get_my_grades(subject="matek")
                       │
                       ▼
                   Chatbot ──[user JWT]──> Monolit /api/grades/me
                       │
                       ▼
                   Claude generálja a választ
                       │
                       ▼
                   SSE stream a frontendnek
```

### Funkciók

**Egyszerű Q&A**: system prompt + chat history per user
**Tool use**: `get_my_grades`, `get_my_subjects`, `get_my_schedule`, `get_class_average`, `get_upcoming_events`, `get_my_assignments`
**RAG**: iskolai dokumentumok feltöltése (házirend, tantárgyi leírások), pgvector + e5 embedding, hybrid search (BM25 + vektor)
**Streaming**: SSE válasz
**Prompt caching**: system prompt + tool definíciók cache-elve → 90% költség-megtakarítás

## 12. Hibakezelési stratégia

### Backend
- **Problem Details (RFC 7807)** egységes válaszformátum:
  ```json
  {
    "type": "https://example.com/probs/grade-not-found",
    "title": "Grade not found",
    "status": 404,
    "detail": "Grade with id=42 does not exist",
    "instance": "/api/v1/grades/42",
    "traceId": "abc-123",
    "errors": [{"field": "value", "message": "..."}]
  }
  ```
- **Error code katalógus** (`docs/error-codes.md`): minden hibatípusnak machine-readable kódja
- **Exception hierarchy**:
  - `DomainException` (ős)
    - `NotFoundException` → 404
    - `ConflictException` → 409
    - `ValidationException` → 400
    - `AuthorizationException` → 403
  - `IntegrationException` (külső szolgáltatás)
- **`@RestControllerAdvice`** mappel exception → Problem Details
- **Resilience4j** circuit breaker + retry + timeout a chatbot↔monolit hívásokon
- **Graceful degradation**: ha chatbot API down → UI "chatbot átmenetileg nem elérhető" üzenet, többi funkció él

### Frontend
- **Error boundary** komponens minden route szinten
- **TanStack Query** retry policy: 3x exponential backoff, 4xx-en nincs retry
- **Toast notification** rendszer (sonner / react-hot-toast)
- **Form validation error** konzisztens megjelenítés (Zod hibák field szinten)
- **Network offline** detection + felhasználói visszajelzés
- **Empty state**-ek minden listanézethez

### Chatbot service
- LLM API hibák egységes kezelése (rate limit, timeout, content filter)
- Tool call hibák visszacsatornázása a Claude-nak (retry vagy graceful válasz)
- User-facing hibaüzenet sose tartalmaz stack trace-t

## 13. Naplózási stratégia

### Backend
- **Structured JSON log** (Logback JSON encoder)
- **Log levels**:
  - `ERROR` — váratlan hiba, vizsgálatra szorul
  - `WARN` — recoverable issue, monitoring
  - `INFO` — request in/out, auth event, üzleti esemény
  - `DEBUG` — fejlesztéshez, prod-on kikapcsolva
  - `TRACE` — soha prod-ban
- **MDC**: traceId, userId, requestId minden logban
- **Sensitive data masking**: jelszó, token, email (`***@example.com`), TAJ-szám, születési dátum — Logback masking layout
- **Request/response logging filter** (csak DEBUG szinten, sensitive headers maszkolva)
- **Performance logging**: slow query (>500ms), slow endpoint (>1s) — WARN
- **Audit log** külön táblába (lásd 6.): minden write művelet
- **Loki** aggregálja, **Grafana** dashboard

### Chatbot service
- Python `structlog` JSON output
- Token usage logging (cost tracking)
- Tool call audit (mit hívott, milyen paraméterrel)

## 14. Karbantarthatóság

- **Code style**: Spotless + Checkstyle Java-ra; ESLint + Prettier + ruff Python-ra — automatic format a CI-ban, build fail ha nem formázott
- **Pre-commit hook** (Husky): format + lint + type check, commit blokk ha hiba
- **PR template** (.github/PULL_REQUEST_TEMPLATE.md): mit, miért, hogyan teszteltem, screenshot, checklist
- **ADR-ek** (`docs/adr/`): Architecture Decision Records — minden nagy döntés markdown-ban, sablon szerint
- **Coverage gate** a CI-ban: JaCoCo 70% line, Vitest 70% line — build fail alatta
- **Dependabot / Renovate**: heti dep upgrade PR-ek
- **SonarLint / SonarCloud** ajánlás a README-ben
- **Conventional Commits + commitlint**: automatic CHANGELOG.md generálás (semantic-release)
- **Module dependency check**: ArchUnit + Spring Modulith verify
- **Naming conventions**: domináns dokumentáció a README-ben (package, osztály, metódus)
- **JavaDoc**: csak publikus API-n a domain rétegben

## 15. Tesztelési stratégia

### Backend
- **Domain unit teszt** (gyors, framework nélkül): minden aggregate, value object, use case
- **Architecture teszt** (ArchUnit): függőségi szabályok, modul határok
- **Integration teszt** (Testcontainers + Postgres): repository, REST endpoint
- **Slice teszt** (`@WebMvcTest`, `@DataJpaTest`): controller, persistence
- **Contract teszt** (Spring Cloud Contract): chatbot ↔ monolit
- **JaCoCo** 70% coverage gate

### Frontend
- **Component teszt** (Vitest + Testing Library)
- **a11y teszt** (axe-core a CI-ban, jest-axe)
- **Visual regression** (Playwright screenshot diff) — opcionális

### E2E
- **Playwright** (web): happy path minden szerepkörre
- **Maestro** (mobile): login + dashboard + push

### Load
- **k6** script: login, grade insert, list query — báziseredmény dokumentálva a README-ben

### Mutation
- **PIT** (Java) néhány kritikus modulra (grading) — opcionális, ha fér

## 16. Performance

- **N+1 detektálás**: Hibernate statistics + assert teszt
- **Bundle size budget** Vite-ban (`build.rollupOptions.output.manualChunks`)
- **Code splitting** route szerint (React.lazy)
- **Image optimization** (WebP, lazy loading)
- **HTTP/2** + gzip/brotli compression (Spring Boot config)
- **Redis cache** read-heavy endpointokon
- **Pagination** kötelezően
- **DB index audit** (explicit dokumentálva)
- **Connection pool** explicit méret (`HikariCP`)
- **Virtual threads** Java 21
- **Graceful shutdown** (`server.shutdown=graceful`, `spring.lifecycle.timeout-per-shutdown-phase=30s`)

## 17. UI/UX

- **Design system**: shadcn/ui (Tailwind + Radix) — accessible, reszponzív, dark mode out of the box
- **Dark / light / high-contrast** mód (Tailwind `dark:` osztály + `prefers-color-scheme` + manual toggle, persisted localStorage)
- **Responsive breakpoint** stratégia: mobile-first, 640/768/1024/1280
- **Loading skeleton** minden async UI-on
- **Empty state**-ek minden listanézethez
- **Toast notification** rendszer (sonner)
- **Form error** konzisztens (Zod + React Hook Form)
- **Keyboard navigation**: minden interaktív elem focusable, tab order helyes
- **A11y audit** axe-core a CI-ban + Lighthouse score >= 90
- **i18n**: react-i18next, HU + EN nyelv (még ha csak HU is van, a setup mutatja a gondolkodást)
- **Storybook** komponens katalógus (`docs/storybook` URL)

## 18. DevOps / deployment

- **Docker Compose** (dev): monolit + chatbot + postgres + redis + observability stack
- **Health check** minden konténerben (`HEALTHCHECK` directive + `depends_on: condition: service_healthy`)
- **Multi-stage Dockerfile**: kis image (distroless / alpine)
- **Helm chart** (`k8s/chart/`): teljes prod-grade deployment (ConfigMap, Secret, HPA, PodDisruptionBudget, NetworkPolicy)
- **GitHub Actions**:
  - `ci.yml`: lint + test + coverage gate + Docker build + SBOM
  - `security-scan.yml`: OWASP dep check + ZAP scan (weekly)
  - `release.yml`: semantic-release + Docker push
- **Secret management**: dev-ben `.env`, prod-ban Vault / SealedSecrets (README)
- **Migration safety**: Flyway versioned, rollback strategy dokumentálva
- **Backup**: `pg_dump` cron script + dokumentáció
- **Graceful shutdown** mindkét service-en
- **Liveness + readiness probe** (Actuator `/health/liveness`, `/health/readiness`)
- **Resource limits** a Helm chartban (CPU/memory)
- **HPA** (Horizontal Pod Autoscaler) CPU + custom metric (RPS)

## 19. Megfigyelhetőség

- **Spring Boot Actuator** + Micrometer
- **Prometheus** scrape, **Grafana** dashboardok:
  - API latency (p50/p95/p99)
  - Error rate per endpoint
  - DB connection pool
  - JVM (heap, GC, threads)
  - HTTP requests per second
  - Chatbot token usage
- **Loki** log aggregation, **LogQL** queries
- **Tempo** distributed tracing (OpenTelemetry agent mindkét service-en)
- **Request ID** propagáció (`X-Request-Id` header) + MDC + log
- **TraceId** Problem Details válaszban
- **Alerting** dokumentálva a `docs/runbook.md`-ben (production-ben mit nézzünk)

## 20. Internationalization

- **Backend**: Spring `MessageSource` + `messages_hu.properties`, `messages_en.properties` (hibaüzenetek)
- **Frontend**: react-i18next, lazy-loaded namespace-ek
- **Date/time/number** formatting: `Intl` API (frontend), `java.time` + locale (backend)
- **Locale detection**: `Accept-Language` header, user preference override

## 21. Dokumentáció

- **README.md**: futtatás, architektúra ábra, design decisions, szerepkör-mátrix, troubleshooting
- **TERV.md**: ez a fájl
- **docs/adr/**: minden nagy döntés ADR-ben
- **docs/api/**: OpenAPI YAML + Swagger UI link
- **docs/architecture.png**: C4 diagram (Container + Component szint)
- **docs/runbook.md**: production üzemeltetési útmutató (alerts, gyakori hibák, debug)
- **docs/error-codes.md**: error code katalógus
- **CONTRIBUTING.md**: hogyan járulhat valaki hozzá
- **CHANGELOG.md**: semantic-release auto-generálja
- **AI_USAGE.md**: ~~kihagyva (user döntés)~~

## 22. Opcionális feature-ök (mind beletervezve)

1. ✅ Súlyozott átlagszámítás + osztály statisztikák
2. ✅ Féléves jegy
3. ✅ Év végi jegy + auto-javaslat súlyozott átlag alapján
4. ✅ Sötét / világos / magas kontraszt mód
5. ✅ Iskolai AI chatbot (külön service, RAG, tool use)
6. ✅ Események (admin létrehoz, target: osztály/szerepkör, hallgató/oktató látja)
7. ✅ Üzenetküldés (REST + polling, opcionálisan WebSocket)
8. ✅ Iskola térkép (statikus SVG + szoba lokáció)
9. ✅ Szavazás / kérdőív (admin létrehoz, target szűkítés, válasz)
10. ✅ Órarend (subject-class assignment + napok/órák) + jelenlét + helyettesítés keresés
11. ✅ Csoportok (osztály ↔ csoport ↔ tárgy)
12. ✅ Beadandók online (file upload S3-kompatibilis MinIO konténer, oktatói értékelés)
13. ✅ Push notification (mobil-specifikus — extra pont)
14. ✅ Kamera (mobil-specifikus — beadandó fotózása)
15. ✅ Helyadatok (mobil-specifikus — esemény térképen)
16. ❌ Social network integráció (külső OAuth — kis pont, nagy munka, kihagyva)

## 23. Párhuzamos AI agent végrehajtási terv

A 100 óra ~6-8 párhuzamos AI agent ablakkal kalendáris ~15-20 óra alatt elvégezhető. **Először szekvenciális alapozó fázis**, utána **párhuzamos feature fázis**.

### Fázis 1: Alapozás (~10 óra, szekvenciális)

1. Repo init, monorepo struktúra, `.gitignore`, README váz
2. Docker Compose (postgres + redis + monolit váz + chatbot váz)
3. Monolit Maven multi-module setup + Spring Modulith + ArchUnit
4. `shared/` modul: security config, exception handler, audit log infrastruktúra, observability
5. `iam` modul: JWT (RS256 keypair), JWKS endpoint, login, refresh, rate limit, BCrypt — **end-to-end működő login**
6. `account` modul: user, role, student, class — admin user-management endpoint
7. Frontend Vite scaffold + Tailwind + shadcn/ui + TanStack Query + AuthContext + route guard
8. **Login flow end-to-end működik** webről

Csak ezután indulhatnak a párhuzamos agent-ek.

### Fázis 2: Párhuzamos feature fejlesztés (~80 óra → 6 agent × ~13 óra)

| Agent | Feladat | Becslés |
|---|---|---|
| **A1: Academic** | `academic` modul (subject, class, assignment), `groups` modul, admin UI ezekre | 13h |
| **A2: Grading** | `grading` modul (Grade aggregate, weighted average, half-year, year-end), oktatói + diák UI | 13h |
| **A3: Scheduling** | `scheduling` modul (ScheduleSlot, Attendance, Substitution), órarend UI mindhárom szerepkörnek | 13h |
| **A4: Engagement** | `messaging`, `events`, `surveys` modulok + UI-ok | 14h |
| **A5: Chatbot + RAG** | Chatbot service teljesen (FastAPI, JWT, tools, RAG, SSE) + frontend chat UI | 14h |
| **A6: Mobile** | React Native (Expo) app: login, dashboard, jegyek, push, kamera, location | 14h |

Az agent-ek **különálló git branch**-en dolgoznak, merge után CI futtatja a teszteket. A monolit modulok egymástól függetlenek (Spring Modulith garantálja), tehát párhuzamosíthatók.

### Fázis 3: Integrációs polishing (~10 óra)

| Munka | Becslés |
|---|---|
| Cross-feature integrációs teszt | 2h |
| Performance audit + optimalizáció | 1.5h |
| A11y audit + javítás | 1h |
| Security audit (OWASP ZAP run, dep check) | 1h |
| Observability stack (Prometheus + Grafana dashboard import) | 1.5h |
| Helm chart + Dockerfile finomítás | 1h |
| Dokumentáció: ADR-ek, API doc, README design decisions, runbook | 1.5h |
| Final smoke test + bug fix | 0.5h |

### Fázis 4: Beadás (~ pár óra)

- Repo cleanup, force-push tilos
- Tag release (`v1.0.0`)
- Screenshot/screencast a README-be
- Final push

## 24. Értékelési szempontok max pont stratégia

| Szempont | Pont | Hogyan érjük el a max-ot |
|---|---|---|
| Kompakt működés | 10 | Minden szerepkörnek tisztán definiált menüpont, nincs félkész gomb, error/empty/loading state mindenhol |
| Részletes funkcionalitás | 10 | 15 opcionális feature készre csinálva, RAG chatbot, súlyozott átlag, jelenlét |
| Szerepkörök és jogosultság | 5 | `@PreAuthorize` + `@PostAuthorize` adat-szint, szerepkör-mátrix dokumentálva, automatikus teszt |
| Kommunikációs technológiák | ? | REST + SSE + JWT + domain event (in-process) + RabbitMQ ha kell, OpenAPI doc, prompt caching |
| Mobil | ? | React Native külön app + push + kamera + location (3 mobil-specifikus → max extra) |
| Dokumentáció | ? | README + ADR + API doc + runbook + architecture diagram + error catalog |
| Repo rendezettség | ? | Conventional Commits, CI green, coverage gate, Dependabot, PR template, monorepo tiszta |
| Skálázhatóság (implicit) | — | Stateless, cache, index, pagination, async event, Helm chart, HPA |
| Biztonság (implicit) | — | 25 pontos security checklist, OWASP scan zöld, audit log |
| Karbantarthatóság (implicit) | — | Hexagonal, Modulith, ADR, coverage gate, format CI |

## 25. README kötelező tartalom

- Architektúra ábra (C4 vagy ASCII)
- Futtatás: `docker-compose up` egy paranccsal
- Inicializációs lépések (seed user-ek, default admin login, példa adat)
- Tech stack összefoglaló
- **Design Decisions** szekció:
  - Miért modular monolith, miért chatbot külön
  - Mit hagytam ki tudatosan (mTLS, Kafka) és miért
  - Skálázási stratégia (stateless, load balancer, read replica, HPA)
  - Biztonsági döntések (JWT vs session, BCrypt, rate limit, audit log)
- Szerepkör-mátrix (ki mit lát/csinál) — táblázat
- API doc link (Swagger UI)
- Mobil app build/futtatás
- Observability dashboard URL-ek
- Troubleshooting / FAQ
- Screenshotok / screencast

## 26. Időbeosztás (100 óra) összesítve

| Fázis | Idő | Tartalom |
|---|---|---|
| Fázis 1 | 10h | Alapozás (szekvenciális) |
| Fázis 2 | 80h | Párhuzamos feature fejlesztés (6 agent) |
| Fázis 3 | 10h | Integrációs polish |
| Fázis 4 | <1h | Beadás |

## 27. Mit NE csináljunk

- Saját JWT impl (használj `io.jsonwebtoken:jjwt`-t)
- Social network OAuth (kis pont, nagy munka)
- mTLS service-to-service (overkill ehhez a forgalomhoz)
- Saját ORM (JPA / SQLAlchemy elég)
- 100% coverage erőltetése (70% reális, kritikus path-ek 90%+)
- Premature optimization (mérjünk, aztán optimalizáljunk)
