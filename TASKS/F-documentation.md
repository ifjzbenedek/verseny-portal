# F — Dokumentáció (ADR-ek, runbook, API doc, architecture diagram)

> **Indulás előtt**: [00-FOUNDATION.md](00-FOUNDATION.md) merged `main`-be. `git pull`.
> Független mindentől, csak a `docs/` mappán és néhány gyökér markdown fájlon dolgozik — A/B/C/D/E-vel párhuzamosan futhat.

## Cél

Production-grade dokumentáció a `docs/` mappában: ADR-ek (Architecture Decision Records), runbook, error code katalógus, API doksi export, C4 architektúra diagram. README design decisions szekció és szerepkör-mátrix.

## Branch

```powershell
git checkout main
git pull
git checkout -b feat/documentation
```

## Tulajdonolt fájlok (kizárólag)

- `docs/` (új mappa, scratch)
- `README.md` (csak az új szekciók hozzáadása, meglévő részt ne írd át)
- `CONTRIBUTING.md` (új)
- `CHANGELOG.md` (új)

## TILOS érinteni

- Bármely kód-mappa (`backend/`, `frontend/`, `chatbot/`, `mobile/`)
- `TERV.md`, `CLAUDE.md`, `TASKS/*`
- `docker-compose.yml`

## Deliverables

### 1. Mappastruktúra

```
docs/
├── README.md                       ← dokumentáció index
├── architecture/
│   ├── c4-context.md               ← C4 Level 1 (System Context)
│   ├── c4-container.md             ← C4 Level 2 (Container)
│   ├── c4-component.md             ← C4 Level 3 (Component, modulonként)
│   ├── data-model.md               ← ER diagram + entitások
│   └── module-dependencies.md      ← Spring Modulith generált
├── adr/
│   ├── README.md                   ← ADR index + sablon
│   ├── 0001-modular-monolith.md
│   ├── 0002-chatbot-as-microservice.md
│   ├── 0003-jwt-based-auth.md
│   ├── 0004-hexagonal-for-new-modules.md
│   ├── 0005-tanstack-query-for-server-state.md
│   ├── 0006-shadcn-ui-design-system.md
│   ├── 0007-pwa-and-react-native-mobile.md
│   ├── 0008-pgvector-for-rag.md
│   ├── 0009-rfc7807-problem-details.md
│   └── 0010-prompt-caching-strategy.md
├── api/
│   ├── README.md                   ← Swagger UI link, modul-csoportok
│   └── openapi.yaml                ← export a backendből
├── runbook.md                      ← üzemeltetési útmutató
├── error-codes.md                  ← error code katalógus
├── role-matrix.md                  ← szerepkör → funkció táblázat
├── security.md                     ← biztonsági overview
└── glossary.md                     ← fogalomtár (osztály, csoport, tárgy, stb.)
```

### 2. ADR sablon (`docs/adr/README.md`)

```markdown
# Architecture Decision Records

Az ADR formátum: rövid markdown, sorszám + cím + státusz + kontextus + döntés + következmények.

## Sablon

# ADR-NNNN: <cím>

**Státusz:** Proposed | Accepted | Deprecated | Superseded by ADR-XXXX
**Dátum:** YYYY-MM-DD
**Döntéshozók:** <név(ek)>

## Kontextus
<Mi a probléma? Mi a környezet?>

## Döntés
<Mit választottunk?>

## Indoklás
<Miért ezt?>

## Következmények
**Pozitív:**
- ...

**Negatív / trade-off:**
- ...

## Alternatívák
- A: <mi és miért nem>
- B: <mi és miért nem>

## Lista

- [ADR-0001](0001-modular-monolith.md): Modular monolith over microservices
- [ADR-0002](0002-chatbot-as-microservice.md): Chatbot as separate Python microservice
- ...
```

### 3. ADR tartalom — minden egyes ADR-t írd meg

**Részlet példa: `0001-modular-monolith.md`**:

```markdown
# ADR-0001: Modular Monolith over Microservices

**Státusz:** Accepted
**Dátum:** 2026-05-11

## Kontextus
Az oktatási portál domain-je (felhasználók, osztályok, tárgyak, jegyek, órarend, üzenetek) erősen összekapcsolt:
egy hallgatói dashboard egyetlen tranzakcióban húz adatot 4-5 domain területről. Microservice-ek esetén ez
distributed transaction problémákhoz, eventual consistency-hez és komplex saga pattern-ekhez vezetne. A csapat
mérete (egy fejlesztő + AI asszisztencia) nem indokol service-enkénti külön release ciklust.

## Döntés
Spring Modulith alapú modular monolith. Egy deployment, egy adatbázis, egy log. A modulok package-szinten
elválasztva, `@ApplicationModule` annotáció enforce-olja a függőségeket compile time-ban.

## Indoklás
- ACID tranzakció minden cross-module művelethez (pl. beadandó értékelés → Grade rögzítés)
- IDE refactor működik módul-határokon át
- Egyetlen log + stack trace debug-hoz
- Kisebb dep-mátrix, gyorsabb build
- Ha skálázódási profil eltér: a hexagonal port/adapter határ miatt egy modul kiemelhető microservice-be (alacsony refactor költség)

## Következmények
**Pozitív:**
- Egyszerűbb dev environment (1 Compose service backend-re)
- Tranzakciós konzisztencia
- Modulith verify build-time biztosítás

**Negatív:**
- Egyetlen JVM instance, mindent terhel
- Skálázás csak függőlegesen + horizontálisan (egész monolitot kell)
- Ha 5+ ember dolgozik egyidejűleg: deployment koordináció

## Alternatívák
- **Microservice-ek 4-5 service-szel**: elvetve a domain összekapcsoltsága + csapatméret miatt
- **Hagyományos monolit (Spring Modulith nélkül)**: elvetve a határvédelmi hiányosság miatt
- **Hexagonal monolit Modulith nélkül**: lehetséges, de a Modulith ingyen ad verify + doc generálást
```

Hasonló mélységgel az összes ADR-t.

### 4. Runbook (`docs/runbook.md`)

```markdown
# Üzemeltetési runbook

## Tartalomjegyzék
1. Service-ek és portok
2. Logok és metrikák hol
3. Gyakori hibák
4. Adatbázis műveletek
5. Deployment
6. Incident response

## 1. Service-ek és portok

| Service | Port | Egészségellenőrzés | Log forrás |
|---|---|---|---|
| Backend | 8081 | `/actuator/health` | stdout JSON |
| Frontend | 5173 (dev) / 80 (prod) | `/` | nginx access |
| Chatbot | 8000 | `/health` | stdout JSON |
| Postgres | 5432 | `pg_isready` | container log |
| Prometheus | 9090 | `/graph` | container log |
| Grafana | 3000 | `/login` | container log |
| Loki | 3100 | `/ready` | container log |

## 2. Megfigyelhetőség

- Grafana dashboards: http://localhost:3000 (admin/admin)
  - `Backend Overview`: API latency, error rate
  - `JVM`: heap, GC, threads
  - `Chatbot`: token usage, tool calls
- Loki query: `{container="portal-backend"} |= "ERROR"`
- Tempo: trace-keresés trace ID alapján (a HTTP válaszban szerepel)

## 3. Gyakori hibák

### "Login után 401-et kapok"
- Lejárt token? Frissíts `POST /api/auth/refresh`-sel.
- Manipulált token? Token signature ellenőrzés a JwtAuthFilter-ben — ellenőrizd a `JWT_SECRET` env-et.

### "Chatbot 502-t ad"
- Anthropic API kulcs hibás? `ANTHROPIC_API_KEY` env.
- Rate limit? Anthropic dashboard ellenőrzés.
- Monolith elérhetetlen a chatbot-ból? Network — Docker Compose ugyanazon hálózaton legyenek.

### "Beadandó upload failed"
- File mérete? `application.yml` `spring.servlet.multipart.max-file-size`.
- Storage írhatóság? `uploads/` mappa permission.

### "Frontend nem éri el a backendet"
- CORS hiba a console-ban? `SecurityConfig` `CorsConfigurationSource` ellenőrzés.
- Proxy: `vite.config.ts` `server.proxy`.

## 4. Adatbázis műveletek

```sql
-- aktív kapcsolatok
SELECT pid, usename, application_name, state, query
FROM pg_stat_activity WHERE state != 'idle';

-- lassú lekérdezések (ha pg_stat_statements engedélyezve)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

-- backup
pg_dump -h localhost -U portal portal > backup_$(date +%F).sql

-- restore
psql -h localhost -U portal -d portal < backup_2026-05-11.sql
```

## 5. Deployment

### Local
```powershell
docker-compose up -d
cd backend && mvn spring-boot:run
cd frontend && npm run dev
```

### Kubernetes
```powershell
helm install portal k8s/chart -f k8s/chart/values.prod.yaml
```

### Migration safety
- Új migration → `Flyway` versioned migration
- Backward-compatible: új mező nullable elsőre, két deploy után NOT NULL
- Rollback: csak forward (down migration NEM ajánlott)

## 6. Incident response

| Severity | Példa | Reakció |
|---|---|---|
| P1 | Backend down | Restart, log nézés, rollback ha kell |
| P2 | Lassú API | Grafana dashboard, slow query analyze |
| P3 | Egy feature hibás | Branch bug fix, normál PR flow |

```

### 5. Error code katalógus (`docs/error-codes.md`)

```markdown
# Error Codes

Minden hiba RFC 7807 Problem Details formátumban, a `type` URI tartalmazza a kódot.

## IAM

| Code | HTTP | Mit jelent | Mit tegyen a kliens |
|---|---|---|---|
| `iam/invalid-credentials` | 401 | Hibás email vagy jelszó | Login form újra |
| `iam/account-locked` | 403 | 5 sikertelen login után 15p lock | Várjon 15 percet |
| `iam/token-expired` | 401 | Access token lejárt | `POST /auth/refresh` |
| `iam/refresh-invalid` | 401 | Refresh token érvénytelen | Login újra |

## Account

| Code | HTTP | Mit jelent |
|---|---|---|
| `account/email-already-exists` | 409 | Email foglalt |
| `account/student-not-found` | 404 | Diák ID nem található |

## Grading

| Code | HTTP | Mit jelent |
|---|---|---|
| `grading/value-out-of-range` | 400 | Jegy érték nem 1-5 között |
| `grading/not-your-assignment` | 403 | Az oktató nem ehhez a tárgyhoz van rendelve |
| `grading/concurrent-modification` | 409 | Másik tanár közben módosította |

(... folytatva minden modulra)
```

### 6. Szerepkör-mátrix (`docs/role-matrix.md`)

Táblázat: minden szerepkör → minden funkció (van hozzáférés / nincs / részleges).

```markdown
# Szerepkör-mátrix

| Funkció | HALLGATO | OKTATO | ADMIN | SUPERADMIN |
|---|---|---|---|---|
| Saját jegyek megtekintése | ✅ | n/a | ✅ (bárkinek) | ✅ |
| Jegy beírás | ❌ | ✅ saját tárgyakra | ❌ | ❌ |
| Tárgy CRUD | ❌ | ❌ | ✅ | ✅ |
| Osztály CRUD | ❌ | ❌ | ✅ | ✅ |
| Felhasználó CRUD (HALLGATO/OKTATO) | ❌ | ❌ | ✅ | ✅ |
| Admin user CRUD | ❌ | ❌ | ❌ | ✅ |
| Esemény létrehozás | ❌ | ❌ | ✅ | ✅ |
| Üzenet küldés/fogadás | ✅ ↔ OKTATO | ✅ ↔ HALLGATO | ✅ | ✅ |
| Kérdőív kreálás | ❌ | ❌ | ✅ | ✅ |
| Beadandó feltöltés | ✅ | ❌ | ❌ | ❌ |
| Beadandó kiírás + értékelés | ❌ | ✅ saját tárgy | ❌ | ❌ |
| Órarend megtekintése | ✅ | ✅ | ✅ | ✅ |
| Órarend létrehozás | ❌ | ❌ | ✅ | ✅ |
| Jelenlét rögzítése | ❌ | ✅ | ✅ | ✅ |
| Chatbot használat | ✅ | ✅ | ✅ | ✅ |
```

### 7. Biztonsági overview (`docs/security.md`)

A `TERV.md` 9. szekciójának kibővített verziója:
- Threat model (mit védünk, ki ellen)
- Authentication flow (JWT issuance, refresh)
- Authorization model (`@PreAuthorize`, `@PostAuthorize`)
- Defense in depth: rate limit, audit log, sensitive data masking
- Production checklist (TLS, secret rotation, dependency updates, security scan)
- Incident response playbook (compromised account, leaked secret)

### 8. API doc (`docs/api/`)

`docs/api/README.md`:
- Swagger UI link: http://localhost:8081/swagger-ui.html
- Modul-csoportok listája
- Authentication: hogyan szerezz JWT-t (curl példa)
- Példa request/response minden főbb endpointra
- Error response formátum (RFC 7807)

`docs/api/openapi.yaml`: futtatható export script: `curl http://localhost:8081/v3/api-docs.yaml > docs/api/openapi.yaml` (a CI-ban automatikus).

### 9. C4 architektúra diagramok

**Eszköz választás (válassz egyet)**:
- Mermaid C4 (`C4Context`) — markdown-ban inline, GitHub renderel
- PlantUML C4 — `docs/architecture/*.puml` + `*.png` export
- Structurizr DSL — leggazdagabb, de külön tooling

**Egyszerűbb választás: Mermaid C4**

`docs/architecture/c4-container.md`:
```markdown
# C4 Container Diagram

\`\`\`mermaid
C4Container
    title Oktatási portál - Container diagram

    Person(student, "Diák")
    Person(teacher, "Oktató")
    Person(admin, "Admin")

    System_Boundary(portal, "Portál") {
        Container(webApp, "Web frontend", "React + Vite")
        Container(mobileApp, "Mobile app", "React Native + Expo")
        Container(monolith, "Backend monolith", "Spring Boot")
        Container(chatbot, "Chatbot service", "Python + FastAPI")
        ContainerDb(db, "Adatbázis", "PostgreSQL + pgvector")
        ContainerDb(redis, "Cache", "Redis")
    }

    System_Ext(claude, "Anthropic Claude API")

    Rel(student, webApp, "Használ", "HTTPS")
    Rel(student, mobileApp, "Használ", "HTTPS")
    Rel(teacher, webApp, "Használ", "HTTPS")
    Rel(admin, webApp, "Használ", "HTTPS")
    Rel(webApp, monolith, "REST API", "JSON/HTTPS")
    Rel(mobileApp, monolith, "REST API", "JSON/HTTPS")
    Rel(webApp, chatbot, "Chat", "SSE/HTTPS")
    Rel(mobileApp, chatbot, "Chat", "SSE/HTTPS")
    Rel(chatbot, monolith, "Tool calls", "JSON/HTTPS")
    Rel(monolith, db, "JPA", "SQL")
    Rel(chatbot, db, "SQLAlchemy", "SQL")
    Rel(monolith, redis, "Cache", "RESP")
    Rel(chatbot, claude, "LLM API", "HTTPS")
\`\`\`
```

Hasonlóan a Context (Level 1) és Component (Level 3) szintekre.

### 10. Glossary (`docs/glossary.md`)

```markdown
# Fogalomtár

| Fogalom | Magyarázat |
|---|---|
| Osztály (Class) | Tanulók egy csoportja, akik együtt kezdtek (pl. 2024/A). Élethossziglani azonosító. |
| Csoport (Group) | Osztályon belüli alcsoport egy adott tárgyra (pl. haladó angol, kezdő matek). |
| Tárgy (Subject) | Tantárgy mint absztrakció (pl. "Matematika"). |
| Tárgy-hozzárendelés (SubjectAssignment) | Konkrét osztály + tárgy + oktató + év hármas. |
| Beadandó (Homework) | Egy tárgy keretében az oktató kiír feladatot, a hallgatók beadnak. |
| Jegy (Grade) | Egy értékelés (1-5), típussal (normál/témazáró/féléves/év végi) és súllyal. |
| Modul (Module) | Spring Modulith értelmében: package-csoport, jól definiált függőségekkel. |
| Aggregate (DDD) | Tranzakciós konzisztencia egysége, egy belépési ponttal (aggregate root). |
```

### 11. README "Design Decisions" szekció

`README.md` végéhez (új szekció):

```markdown
## Design Decisions

A főbb architektúrális döntéseket ADR-ek dokumentálják: lásd [docs/adr/](docs/adr/).

Kiemelten:
- **[ADR-0001](docs/adr/0001-modular-monolith.md)**: Modular monolith Spring Modulith-tal — egyszerű deploy, ACID tranzakció, modul-határ compile-time enforce-olva.
- **[ADR-0002](docs/adr/0002-chatbot-as-microservice.md)**: Chatbot mint külön Python service — eltérő tech stack (LLM ökoszisztéma), failure isolation, lassú LLM hívások.
- **[ADR-0004](docs/adr/0004-hexagonal-for-new-modules.md)**: Hexagonal layering új modulokban — port a domain-ben, adapter az infrastructure-ben, framework-mentes domain.

### Skálázási stratégia

A monolit **stateless** (JWT session-mentes), így horizontálisan skálázható load balancer mögött. Adatbázis read replica + connection pool a write-throughput-ra. A chatbot service külön skálázható az LLM-hívások eltérő profilja miatt. HPA a Helm chartban CPU + custom metric (RPS) alapon.

### Biztonsági döntések

- JWT bearer token + httpOnly refresh cookie
- BCrypt jelszó (strength=12)
- `@PreAuthorize` minden endpointon, default deny
- Bucket4j rate limit a login endpointokon (5/perc/IP)
- Audit log minden write művelet
- RFC 7807 Problem Details válasz, traceId-vel

### Mit csinálnék production-ben máshogy

- Vault / SealedSecrets a secret management-re
- Külön Postgres + Redis Kubernetes operator-ral
- ELK stack a strukturált logokhoz (Loki helyett a feature-set miatt)
- mTLS service-to-service (chatbot ↔ monolith)
- Multi-region active-active
```

### 12. README "Szerepkör-mátrix" szekció

Linkeld a `docs/role-matrix.md`-t a README-ből.

### 13. CONTRIBUTING.md

```markdown
# Contributing

## Branch stratégia
- `main`: stabil
- `feat/<rövid-leírás>`: új feature
- `fix/<rövid-leírás>`: bugfix
- `refactor/<rövid-leírás>`: nem-funkcionális

## Commit üzenetek
Conventional Commits formátum (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).

## PR követelmények
- CI zöld
- Coverage >= 70%
- Spotless / ESLint clean
- Reviewer 1 db (saját kódot is mergelheted, ha CI zöld)

## Lokális futtatás
Lásd [README.md](README.md).

## Modul-szerkezet
Új feature → új modul a `com.verseny.portal.<modul>` package alatt, hexagonal layering:
- `api/` — publikus interface
- `domain/` — tiszta üzleti logika
- `application/` — use case-ek
- `infrastructure/` — REST, JPA adapterek

ArchUnit teszt enforce-olja a függőségi szabályokat.
```

### 14. CHANGELOG.md

`semantic-release` később auto-generálja. Most:

```markdown
# Changelog

A formátum [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) szerinti.

## [Unreleased]

### Added
- Core entitások: Class, Student, Subject, SubjectAssignment, Grade
- Spring Modulith
- Hexagonal modulok: scheduling, messaging, events, homework, groups, surveys
- Chatbot service (Python + FastAPI + Claude)
- React Native mobile app (Expo)
- Sötét/világos mód + i18n (HU/EN)
- Observability stack (Prometheus + Grafana + Loki)

## [0.1.0] - 2026-05-11
### Added
- Initial boilerplate: Spring Boot + React + JWT + Course example
```

### 15. docs/README.md (dokumentáció index)

```markdown
# Dokumentáció

| Téma | Hol |
|---|---|
| Projekt áttekintés | [/README.md](../README.md) |
| Részletes terv | [/TERV.md](../TERV.md) |
| Architektúra (C4) | [architecture/](architecture/) |
| Architectural Decision Records | [adr/](adr/) |
| API referencia | [api/](api/) + http://localhost:8081/swagger-ui.html |
| Üzemeltetési runbook | [runbook.md](runbook.md) |
| Error code katalógus | [error-codes.md](error-codes.md) |
| Szerepkör-mátrix | [role-matrix.md](role-matrix.md) |
| Biztonsági overview | [security.md](security.md) |
| Fogalomtár | [glossary.md](glossary.md) |
```

## Definition of Done

- [ ] `docs/` mappa minden alábbi tartalommal kész
- [ ] 10+ ADR megírva (lásd lista)
- [ ] Runbook minden szekcióval teljes
- [ ] Error code katalógus a jelenlegi exception-ökre
- [ ] Szerepkör-mátrix
- [ ] C4 diagramok (Context + Container + Component szint)
- [ ] Glossary
- [ ] README "Design Decisions" + "Szerepkör-mátrix" link kiegészítés
- [ ] CONTRIBUTING.md + CHANGELOG.md
- [ ] Minden Mermaid diagram renderel GitHub-on (PR preview ellenőrzés)
- [ ] PR `main`-be

## Tipp

- A kódot **nem értelmezed** ehhez a feladathoz: csak rendszerező, architektúrális dokumentáció. Az API specifikus részekhez a Swagger UI / OpenAPI exportja segít.
- Az ADR-ek tipikusan rövidek (1-2 oldal). Ne írj regényt — döntés + indok elég.
- Mermaid C4 GitHub-on natív renderelést kap, nem kell külön tooling.
- A `docs/api/openapi.yaml` export-ot a CI-ba automatizálhatod: a frontend build előtt fetch a backend `/v3/api-docs.yaml`-ből és commit.
