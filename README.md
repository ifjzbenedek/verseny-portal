# Oktatásszervezési Portál — BME VIK Fullstack Verseny

Spring Boot + React + TypeScript + Postgres + PWA, JWT auth role-based jogosultsággal (`SUPERADMIN` / `ADMIN` / `OKTATO` / `HALLGATO`). Külön Python (FastAPI + Gemini) chatbot service.

## Élő demo

- **Frontend (Vercel)**: <https://verseny-portal.vercel.app>
- **Backend health (Railway)**: <https://backend-production-9ebe.up.railway.app/api/health>
- **Swagger UI (Railway)**: <https://backend-production-9ebe.up.railway.app/swagger-ui.html>

A Railway free tier ~15 perc inaktivitás után alvó, az első kérés 30–60 mp-be telhet — utána gyors.

## Teszt-felhasználók

Jelszó mindenkinek: **`password`**. A `DataSeeder` indításkor / első Railway boot-kor létrehozza őket.

| Email | Szerepkör | Megjegyzés |
|---|---|---|
| `superadmin@portal.hu` | SUPERADMIN | mindent lát/módosíthat |
| `admin@portal.hu` | ADMIN | felhasználó-, osztály-, tárgy-, assignment-kezelés |
| `oktato@portal.hu` | OKTATO | Dr. Példa Oktató — Magyar |
| `matek.tanar@portal.hu` | OKTATO | Dr. Matek Tanár |
| `tortenelem.tanar@portal.hu` | OKTATO | Dr. Történelem Tanár |
| `hallgato@portal.hu` | HALLGATO | Példa Hallgató (2024/A) |
| `diak.a1@portal.hu` | HALLGATO | Kovács Anna (2024/A) |
| `diak.a2@portal.hu` | HALLGATO | Nagy Béla (2024/A) |
| `diak.b1@portal.hu` | HALLGATO | Szabó Csilla (2024/B) |
| `diak.b2@portal.hu` | HALLGATO | Tóth Dávid (2024/B) |

## Lokális futtatás

Szükséges: **Docker Desktop**, **JDK 17+**, **Maven 3.8+**, **Node.js 18+**. (Chatbothoz: csak Docker, vagy Python 3.12 + `pip`.)

### 1) Postgres + (opcionálisan) Chatbot

```powershell
docker-compose up -d        # db (:5432) + chatbot (:8000)
docker-compose up -d db     # csak az adatbázis, ha nem kell chatbot
```

A `docker-compose.yml` két service-t indít:

- **`db`** (Postgres 15) — port `5432`, database `portal`, user/jelszó `portal/portal`, perzisztens volume `portal-data`.
- **`chatbot`** (Python + FastAPI + Gemini) — port `8000`. Csak akkor használható, ha `GEMINI_API_KEY`-t adsz át (lásd lent).

Ha nincs Docker: lokális Postgres 15 + `CREATE DATABASE portal;` és állítsd át a [backend/src/main/resources/application.yml](backend/src/main/resources/application.yml) `spring.datasource.url`-jét.

### 2) Backend (Spring Boot, port 8081)

```powershell
cd backend
mvn spring-boot:run
```

- Health: <http://localhost:8081/api/health>
- Swagger UI: <http://localhost:8081/swagger-ui.html>

Az `application.yml` defaultja lokál Postgres-re mutat (`jdbc:postgresql://localhost:5432/portal`). A `DataSeeder` minden induláskor idempotensen biztosítja a fenti felhasználókat + osztályokat (2024/A, 2024/B) + tárgyakat (Matematika, Történelem, Magyar) + jegyeket + eseményeket. Schema-frissítés: `spring.jpa.hibernate.ddl-auto: update`.

> A backend 8081-en hallgat (nem 8080), mert Windows-on a System (PID 4) gyakran foglalja a 8080-at. A frontend Vite proxy + Docker chatbot már mind erre a portra mutat — ha mégis át kell írni, három helyen kell ([backend/src/main/resources/application.yml](backend/src/main/resources/application.yml), [frontend/vite.config.ts](frontend/vite.config.ts) `server.proxy`, [docker-compose.yml](docker-compose.yml) chatbot `MONOLITH_BASE_URL`).

### 3) Frontend (React + Vite + PWA, port 5173)

```powershell
cd frontend
npm install
npm run dev
```

A Vite dev server `/api`-t proxyzza a backendre (`localhost:8081`), így nem kell külön CORS dev-ben. PWA telepítés: Chrome → "Add to Home Screen" (csak HTTPS-en, vagyis a Vercel URL-en, nem a localhost-on).

### 4) Chatbot (opcionális, csak ha Gemini van)

A `docker-compose up -d chatbot` parancs elindítja a Python service-t a `8000` porton. A `frontend/src/features/chat/ChatPage.tsx` a `VITE_CHATBOT_URL` env varból olvas (`http://localhost:8000` a default), lokálban szóval extra konfig nem kell.

Konfigurálandó env varok (mind `docker-compose.yml`-ből override-olható):

| Env | Default | Mire való |
|---|---|---|
| `GEMINI_API_KEY` | — (üres ⇒ a chatbot UI üzen, de nem ad választ) | Google AI Studio kulcs |
| `JWT_SECRET` | egyező a backend-del | a backend tokenjeit így validálja a chatbot |
| `MONOLITH_BASE_URL` | `http://host.docker.internal:8081` | Docker-on belüli backend hívás (Windows/Mac OK; Linuxon a `host-gateway` extra host adja a host elérést — lásd `docker-compose.yml`) |
| `CORS_ORIGIN` | `http://localhost:5173` | a frontend origin |
| `GEMINI_MODEL` | `gemini-2.5-flash` | bármely Gemini model id |

Production deploy-ban a chatbot **nincs felhúzva**, ezért a Vercel-en a chat oldal jelez egy figyelmeztetést. Részletek a [DEPLOY.md](DEPLOY.md)-ben.

## Tesztek

### Backend

```powershell
cd backend
mvn test
```

33 unit + repository teszt (`src/test/java/com/verseny/portal/`):

- `dto/EventResponseTest` (3) — DTO mapping
- `dto/DtoMappingTest` (2) — `SchoolClassResponse.displayName`, `StudentResponse` flat mapping
- `service/EventServiceTest` (6) — Mockito
- `service/AuthServiceTest` (6) — register / login flow + `ConflictException`/`AuthorizationException`
- `service/GradingServiceTest` (9) — OKTATO authorization edge case-ek, súlyozott átlag math
- `security/JwtUtilTest` (4) — claim-ek, lejárati delta, idegen kulcs, lejárt token
- `repository/EventRepositoryTest` (3) — `@DataJpaTest` + H2 in-memory (külön Postgres nem kell)

### Frontend

```powershell
cd frontend
npm test           # vitest run — 9 teszt
npm run typecheck  # tsc -b --noEmit
npm run lint       # eslint .
npm run build      # tsc + vite build
```

## Architektúra

```
        ┌─────────────────┐                                     ┌────────────────┐
        │  Vercel CDN     │                                     │ Google Gemini  │
        │ (PWA static)    │                                     │   (LLM API)    │
        └────────┬────────┘                                     └────────▲───────┘
                 │ HTTPS                                                 │
                 ▼                                                       │
┌─────────────────────────┐    REST/JSON    ┌──────────────────────────┐ │
│ React + Vite + TS       │ ──────────────► │ Spring Boot 3.2 (Java)   │ │
│ shadcn/ui + Tailwind    │   JWT bearer    │ JWT + role-based         │ │
│ TanStack Query + Zod    │ ◄────────────── │ @PreAuthorize            │ │
│ react-i18next (HU/EN)   │                 └────────────┬─────────────┘ │
│ vite-plugin-pwa         │                              │               │
└─────┬───────────────────┘                              │ JPA           │
      │   /chat (külön)                                  ▼               │
      │                                       ┌──────────────────────┐   │
      ▼                                       │ PostgreSQL 15        │   │
┌──────────────────────────┐ JWT-relayed      │ (Supabase prod /     │   │
│ Python + FastAPI         │ ───── tool ─────►│  docker-compose lokál│   │
│ Gemini SDK               │   monolith call  └──────────────────────┘   │
│ (csak lokálban)          │ ───────────────────────────────────────────►│
└──────────────────────────┘
```

## Frontend struktúra

Feature-folder, `@/` alias `src/`-re ([tsconfig.json](frontend/tsconfig.json) + [vite.config.ts](frontend/vite.config.ts)):

```
frontend/src/
├── auth/          AuthContext (TanStack Query-aware), ProtectedRoute, RoleGuard, login/register
├── shared/
│   ├── api/       axios client (Bearer interceptor + 401→logout), QueryClient
│   ├── components/  AppLayout (sidebar+topbar+sheet), ThemeToggle, LanguageSwitcher, ui/ (shadcn)
│   ├── hooks/     useTheme (light/dark/high-contrast/system, localStorage)
│   ├── lib/       cn helper, JWT decode
│   └── types/     API DTO típusok (egyezik a backend `dto/*Dtos.java`-val)
├── features/
│   ├── dashboard/        role-szerinti DashboardRouter
│   ├── grades/           Zod schemas + TanStack hooks + MyGrades/RecordGrade/ClassAverages
│   ├── subjects/, classes/, users/, assignments/  — teljes CRUD
│   ├── events/           Card grid + AlertDialog confirm + Geolocation API ("Helyzetem")
│   ├── schedule/         heti óratábla
│   ├── messaging/        polling-alapú üzenetek
│   ├── chat/             FastAPI chatbot proxy + lokális history
│   └── settings/         téma + nyelv
├── legacy/        régi Dashboard + Courses shadcn-re átírva, referencia mintaként
├── i18n/          HU + EN fordítások (react-i18next + browser language detector)
└── styles/        Tailwind directives + shadcn CSS változók 3 témára
```

## Mobilitás

A webalkalmazás reszponzív (Tailwind + shadcn/ui mobile-first defaultokkal). PWA-ként telepíthető Chrome / Safari "Add to Home Screen" menüből — saját ikon, splash screen, offline cache a service workerből.

### Mobil-specifikus funkciók

- **Geolocation API** az Események oldalon: a "Helyzetem" gombbal megosztja a pozíciót, és minden eseménykártyán megjelenik a távolság (Haversine képlettel). A seedelt események BME-koordinátákat kaptak.
- **PWA service worker** (`vite-plugin-pwa` autoUpdate): offline cache + installálható manifest 192/512 px ikonokkal.
- **Apple touch icon** iOS PWA-hoz (180×180).

### Tervezett, kihagyott

Külön natív / cross-platform mobil alkalmazás (React Native + Expo) tervben volt (lásd [TASKS/D-mobile-expo.md](TASKS/D-mobile-expo.md)), de a PWA funkcionálisan ugyanazt adja a böngészős Web API-kon át (Geolocation, MediaDevices, Notifications).

## Production deploy

A `main` branch GitHub push-ra Railway (backend) és Vercel (frontend) automatikusan újra-deployol. Manuális deploy a [`redeploy.ps1`](redeploy.ps1) scripttel a repo gyökérből:

```powershell
.\redeploy.ps1                 # backend + frontend
.\redeploy.ps1 -BackendOnly
.\redeploy.ps1 -FrontendOnly
```

A teljes felhő-setup (Supabase Postgres + Railway backend + Vercel frontend, env varok, CORS lánc, gotcha-k) **[DEPLOY.md](DEPLOY.md)**-ben.

## Tech-stack

| Réteg | Választás |
|---|---|
| Adatbázis | PostgreSQL 15 (Supabase prod / docker-compose lokál) |
| Backend monolit | Spring Boot 3.2 (Java 17) |
| Modul-szerkezet | flat package-by-feature (model / repository / service / controller / dto) |
| Chatbot service | Python 3.12 + FastAPI + Google Gemini SDK |
| Web frontend | React 18 + TypeScript + Vite 5 + Tailwind + shadcn/ui (Radix) |
| Server state | TanStack Query 5 |
| Form / validáció | react-hook-form + Zod |
| i18n | react-i18next (HU/EN) |
| Mobil | PWA (vite-plugin-pwa, manifest + service worker), Geolocation API |
| Auth | JWT (jjwt 0.12, HS256) |
| ORM | Spring Data JPA + Hibernate |
| Tesztelés | JUnit 5 + Mockito + Spring `@DataJpaTest` + H2; Vitest + RTL + jest-axe |
| Hosting | Railway (BE) + Vercel (FE) + Supabase (DB) |

## Dokumentáció

- **[DEPLOY.md](DEPLOY.md)** — Production deploy (Supabase + Railway + Vercel) lépésről lépésre
- **[CHANGELOG.md](CHANGELOG.md)** — verziónkénti változások (Keep a Changelog)
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — branch + commit konvenciók
- **[CLAUDE.md](CLAUDE.md)** — AI agent kontextus
- **[TERV.md](TERV.md)** — teljes architektúra-terv, modulok, biztonság, tesztelés
- **[docs/](docs/)** — architektúrális doksik (ADR-ek, C4 ábra, role mátrix, fogalomtár)
  - [ADR-0001 — Modular monolit](docs/adr/0001-modular-monolith.md)
  - [ADR-0002 — Chatbot különálló service](docs/adr/0002-chatbot-as-microservice.md)
  - [ADR-0003 — JWT stateless auth](docs/adr/0003-jwt-based-auth.md)
  - [C4 Container ábra](docs/architecture/c4-container.md)
  - [Szerepkör mátrix](docs/role-matrix.md)
  - [Fogalomtár](docs/glossary.md)
- **[nyilatkozat/](nyilatkozat/)** — Generatív MI használati nyilatkozat
