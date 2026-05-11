# Projekt-kontextus Claude Code számára

**Feladat:** Oktatásszervezési digitális portál (BME VIK Modern Fullstack és Mobil Fejlesztői Verseny).
**Időkeret:** ~100 óra (több AI agent párhuzamosan dolgozik). A részletes terv a [TERV.md](TERV.md)-ben.
**Cél:** maximum pont minden értékelési szempontban (kompakt működés, részletes funkcionalitás, szerepkörök, karbantarthatóság, biztonság, UX, dokumentáció).

## Architektúra dióhéjban

- **Backend (monolit)**: Spring Boot 3.x + Postgres + JWT. Új modulokat **Spring Modulith** package-struktúrával + **hexagonal (ports & adapters)** stílusban írunk. A meglévő `Course` minta marad amíg refaktorra nincs idő.
- **Chatbot service**: külön Python + FastAPI service (`chatbot/`), kommunikál a monolittal a user JWT-jével.
- **Web frontend**: React + Vite + TS + Tailwind + shadcn/ui + TanStack Query + Zod (`frontend/`). Feature-folder struktúra.
- **Mobil**: két szinten — meglévő PWA + új külön React Native (Expo) app (`mobile/`) push/kamera/location-nel az extra pontért.
- **Adatbázis**: PostgreSQL, modulonként saját schema (logikai izoláció).

## Stack táblázat (értékelői dokumentálás)

| Réteg | Választás |
|------|-----------|
| Adatbázis | PostgreSQL 15 (+ pgvector chatbot RAG-hez) |
| Backend monolit | Spring Boot 3.2 (Java 17/21) |
| Modul határok | Spring Modulith + ArchUnit |
| Chatbot service | Python 3.12 + FastAPI + Anthropic SDK |
| Web frontend | React 18 + TypeScript + Vite + Tailwind + shadcn/ui |
| Mobil (alap) | PWA (vite-plugin-pwa) |
| Mobil (extra) | React Native + Expo (push, camera, location) |
| Auth | JWT (jjwt 0.12, RS256) |
| ORM | Spring Data JPA + Hibernate |
| Observability | Spring Actuator + Micrometer + Prometheus + Grafana + Loki |

## Gyors indítás (dev)

### 1) Postgres
```powershell
docker-compose up -d
```

### 2) Backend
```powershell
cd backend
mvn spring-boot:run
```
http://localhost:8081 — `DataSeeder` létrehoz 3 teszt-felhasználót.

> Backend 8081-en, mert Windows-on a System (PID 4) gyakran foglalja a 8080-at. Frontend Vite proxy a 8081-re mutat.

### 3) Frontend
```powershell
cd frontend
npm install
npm run dev
```
http://localhost:5173 — Telefonon Chrome → "Add to Home screen" PWA telepítés.

### Default seed-elt user-ek (jelszó mindenkinek: `password`)
- `admin@portal.hu` (ADMIN)
- `oktato@portal.hu` (OKTATO)
- `hallgato@portal.hu` (HALLGATO)

## Konvenciók

### Új modulok (academic, grading, scheduling, stb.)
Spring Modulith package alatt, hexagonal layeringgel:
```
<modul>/
├── api/                  ← más modulok ezt látják
├── domain/               ← tiszta üzleti logika, framework-mentes
├── application/          ← use case-ek
└── infrastructure/       ← web, persistence adapters
```
A domain layer **semmilyen Spring/JPA-t nem importál**. ArchUnit teszt enforce-olja.

### Meglévő `Course` minta
Marad a repóban referenciaként. Ha gyors prototípus kell, a Course-ot lehet másolni. **Új feature-öket viszont a fenti hexagonal stílusban** írunk.

### Frontend feature-folder
```
src/features/<feature>/
├── api/                  ← TanStack Query hooks
├── components/
├── pages/
└── types.ts              ← Zod schemas
```

### Conventional Commits
`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:` prefixek.

### Code style
- Backend: Spotless + Checkstyle (CI-ban auto-format)
- Frontend: ESLint + Prettier (pre-commit hook)
- Strict TypeScript

## Mi van már a repóban

- JWT login/register, role-based endpoint védelem (`@PreAuthorize`)
- `Course` entity teljes CRUD flow példaként
- React: AuthContext, ProtectedRoute, axios interceptor JWT-vel
- PWA manifest + service worker
- CORS bekonfigurálva localhost:5173-ra
- Docker-compose Postgres
- Deploy konfig: Supabase (DB) + Render (BE) + Vercel (FE) — lásd [DEPLOY.md](DEPLOY.md)

## Hol találod a teljes tervet

- **[TERV.md](TERV.md)** — komplett architektúra, adatmodell, modulok, biztonság, tesztelés, dokumentáció, párhuzamos agent végrehajtási terv
- **[README.md](README.md)** — futtatási útmutató + tech-stack
- **[DEPLOY.md](DEPLOY.md)** — production deploy lépések

## Slash command-ok (saját)

- `/ertekel` — önértékelés a TERV.md szempontjai szerint. Output: `nyilatkozat/output/ertekel-YYYY-MM-DD-HHMM.md`

(Az `/nyilatkozat` és AI-prompt-logolás **nem kell** ehhez a verzióhoz — a feladat nem követeli meg.)
