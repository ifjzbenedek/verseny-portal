# Oktatásszervezési Portál — BME VIK Fullstack Verseny

Spring Boot + React + TypeScript + Postgres + PWA. Egyszereplős → többszereplős auth (ADMIN / OKTATO / HALLGATO) JWT-vel.

## Gyors indítás (3 terminál)

### 1) Postgres (Docker)
```powershell
docker-compose up -d
```
Ha nincs Docker: lokális Postgres 15 + `CREATE DATABASE portal;` és állítsd át a `backend/src/main/resources/application.yml`-t.

### 2) Backend (Spring Boot)
```powershell
cd backend
mvn spring-boot:run
```
Backend: http://localhost:8081. A `DataSeeder` indításkor létrehoz három teszt-felhasználót.

> **Megjegyzés**: Eredetileg 8080-on lett volna, de Windows-on a System (PID 4) gyakran foglalja → 8081-re állítottuk. Ha más port-ütközés van, állítsd át a `backend/src/main/resources/application.yml`-ben és a `frontend/vite.config.ts`-ben.

Default jelszó mindenkinek: **`password`**
- `admin@portal.hu` (ADMIN)
- `oktato@portal.hu` (OKTATO)
- `hallgato@portal.hu` (HALLGATO)

### 3) Frontend (React + Vite + PWA)
```powershell
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173. Telefonon Chrome → "Add to Home screen" → telepíthető PWA.

## Architektúra

```
[ PWA Frontend ] --REST/JSON--> [ Spring Boot ] --JPA--> [ Postgres ]
   React + TS                     JWT auth
   Vite + PWA                     Role-based @PreAuthorize
```

## Mit tartalmaz a boilerplate
- JWT login/register, role-based endpoint védelem (`@PreAuthorize`)
- Példa CRUD: `Course` entity teljes flow-val (lista, létrehoz, szerkeszt, töröl)
- React: AuthContext, ProtectedRoute, axios interceptor JWT-vel
- PWA manifest + service worker
- CORS bekonfigurálva localhost:5173-ra
- Docker-compose Postgres
- AI-nyilatkozat generálás: `.claude/commands/nyilatkozat.md` → ld. [nyilatkozat/README.md](nyilatkozat/README.md)

## Frontend (B brief — `feat/frontend-redesign`)

A frontend feature-folder szerkezetbe lett átszervezve:

```
frontend/src/
├── auth/                  AuthContext, ProtectedRoute, RoleGuard, login/register oldalak
├── shared/
│   ├── api/               axios client + TanStack Query QueryClient
│   ├── components/        AppLayout, ThemeToggle, LanguageSwitcher, ui/ (shadcn)
│   ├── hooks/             useTheme (light/dark/high-contrast/system)
│   ├── lib/               cn helper, JWT decode
│   └── types/             API entitás típusok (Role, AppUser, Grade, ...)
├── features/
│   ├── dashboard/         role-szerinti DashboardRouter (HALLGATO/OKTATO/ADMIN/SUPERADMIN)
│   ├── grades/            Zod schema + TanStack hooks + MyGrades / RecordGrade / ClassAverages
│   ├── subjects/, classes/, users/, assignments/, schedule/, messaging/,
│   │   events/, homework/, groups/, surveys/  — stubok (Foundation merge után élesítve)
│   ├── chat/              localStorage mock chatbot UI (Window C service-éhez köthető)
│   └── settings/          téma + nyelv kapcsolók
├── legacy/                régi Dashboard.tsx + Courses.tsx megőrizve referenciaként
├── i18n/                  HU + EN fordítások (`react-i18next` + browser detector)
└── styles/globals.css     Tailwind directives + shadcn CSS változók (3 téma)
```

Tech-stack:
- **shadcn/ui** (Radix primitives + Tailwind) komponensekkel
- **TanStack Query** server state-re, axios interceptorral 401-en logout
- **Zod + react-hook-form** runtime validációval, accessibilis form hibákkal
- **react-i18next** HU/EN nyelvi switch, `localStorage` cache
- **`useTheme`**: `'light' | 'dark' | 'high-contrast' | 'system'`, `data-theme` attribútumon keresztül
- **`@/`** alias → `src/` (`tsconfig.json` + `vite.config.ts`)
- **Sonner** toast a feedback-hez

Futtatás:
```powershell
cd frontend
npm install
npm run dev      # → http://localhost:5173
npm run build    # tsc + vite build
```

## Versenynapi runbook
Ld. [CLAUDE.md](CLAUDE.md).

## Deploy
Supabase Postgres + Render (backend) + Vercel (frontend): [DEPLOY.md](DEPLOY.md).

## Tech-stack táblázat (értékelői dokumentálás)
| Réteg | Választás |
|------|-----------|
| Adatbázis | PostgreSQL 15 |
| Backend | Spring Boot 3.2 (Java 17) |
| Frontend | React 18 + TypeScript + Vite |
| Mobil | PWA (vite-plugin-pwa, manifest + service worker) |
| Auth | JWT (jjwt 0.12) |
| ORM | Spring Data JPA + Hibernate |

## Dokumentáció

Részletes architektúrális és üzemeltetési doksik a [docs/](docs/) mappában.

- [Architektúrális döntések (ADR)](docs/adr/): a fő technikai választások indoklással.
- [C4 Container ábra](docs/architecture/c4-container.md): rendszerszintű komponensképet ad.
- [Szerepkör mátrix](docs/role-matrix.md): ki mit lát, ki mit csinálhat.
- [Fogalomtár](docs/glossary.md): a kódban szereplő nevek értelmezése.

A fő döntések rövid összefoglalása:

- **Modular monolit Spring Modulith-tal** ([ADR-0001](docs/adr/0001-modular-monolith.md)): a domain erősen összekapcsolt, így ACID tranzakció és egyszerű deploy mellett a modulhatárokat build-time verify tartja egyben.
- **Chatbot különálló Python service-ként** ([ADR-0002](docs/adr/0002-chatbot-as-microservice.md)): a Python AI ökoszisztémája erősebb, az LLM hívás lassú, és failure isolation kell.
- **JWT alapú stateless auth** ([ADR-0003](docs/adr/0003-jwt-based-auth.md)): web, mobil és chatbot egységesen használja, a backend stateless marad.

