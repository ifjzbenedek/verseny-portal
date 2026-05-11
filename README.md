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
