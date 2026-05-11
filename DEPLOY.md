# Production deploy — Supabase + Railway + Vercel

Az élő rendszer **Supabase** (Postgres), **Railway** (Spring Boot) és **Vercel** (Vite PWA) hármason fut.

Élő URL-ek:

- **Frontend**: <https://verseny-portal.vercel.app>
- **Backend**: <https://backend-production-9ebe.up.railway.app>
  - Health: `/api/health` → `{"status":"UP"}`
  - Swagger: `/swagger-ui.html`

Sorrend kötött: **DB → Backend → Frontend** (mindegyik az előzőre épül). A chatbot service production-ben **nincs deployolva** — csak lokálban (docker-compose). Részletek lent.

---

## Egyszerre újradeploy (`redeploy.ps1`)

A repo gyökerében:

```powershell
.\redeploy.ps1                  # backend (Railway) + frontend (Vercel)
.\redeploy.ps1 -BackendOnly
.\redeploy.ps1 -FrontendOnly
```

A script azt futtatja, amit az alábbi manuális lépések szöveggel leírnak:

1. `cd backend && railway up --service backend --ci` — Dockerfile build + push Railway-re
2. `vercel --prod --yes` a repo gyökérből — frontend build + deploy a `vercel.json` szerint

Szükséges CLI-k a `redeploy.ps1` futtatásához:

- **Railway CLI** (`npm i -g @railway/cli`, majd `railway login`)
- **Vercel CLI** (`npm i -g vercel`, majd `vercel login`)
- A `.vercel/project.json` linkeli a lokál mappát a Vercel projekttel — ez már benne van a repóban, így újra-link nem kell.

A `main`-re pusholva mindkét deploy auto-trigger-elődik (Railway + Vercel webhook), tehát a script csak akkor kell, ha out-of-band változtatást deployolnál.

---

## Manuális first-time setup

### 1) Supabase Postgres (~5 perc)

1. <https://supabase.com/dashboard> → **New project**
2. Project name: tetszőleges, DB password: **mentsd el** (Railway env varba kell), region: lehetőleg Frankfurt vagy közelebbi EU.
3. Várj 1-2 percet amíg kiépül.
4. **Project Settings → Database → Connection string** → **Session pooler** fül (NEM "Direct connection", NEM "Transaction pooler").
   - **Miért a session pooler**: Railway IPv4-en csatlakozik, a direct connection IPv6-only. A transaction pooler viszont **nem támogatja a server-side prepared statementeket**, amiket Hibernate alapból használ. A session pooler a sweet spot.
   - Az [`application-prod.yml`](backend/src/main/resources/application-prod.yml) ezzel kompatibilis Hikari-pool méretet (5) + `jdbc.lob.non_contextual_creation: true` beállítást használ.
5. Másold ki a 3 értéket a következő lépéshez:
   - **JDBC URL**: `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres`
   - **Username**: `postgres.<project-ref>`
   - **Password**: a 2. lépésben elmentett

### 2) Railway — Spring Boot (~5 perc)

1. <https://railway.app> → **New Project → Deploy from GitHub repo** → válaszd a `verseny-portal` repót.
2. A Railway azonosítja a [`backend/Dockerfile`](backend/Dockerfile)-t. Service neve legyen **`backend`** (a `redeploy.ps1` ezt használja).
3. **Settings → Root Directory**: `backend`
4. **Settings → Variables** — add hozzá:

| Env var | Érték / forrás |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres` |
| `SPRING_DATASOURCE_USERNAME` | `postgres.<project-ref>` |
| `SPRING_DATASOURCE_PASSWORD` | a Supabase DB jelszó |
| `JWT_SECRET` | legalább 32 byte (pl. `openssl rand -hex 32`) |
| `CORS_ORIGINS` | **kezdetben hagyd üresen**, a Vercel URL után állítsd |
| `JWT_EXPIRATION_MS` | (opcionális) default `86400000` = 1 nap |
| `PORT` | Railway injektálja, a backend `${PORT:8081}`-et olvas |

5. A Dockerfile fixen `SPRING_PROFILES_ACTIVE=prod` környezetet állít be, így az `application-prod.yml` lép életbe.
6. **Deploy**. Az első build ~3-5 perc (Maven dependency-letöltés). A health check `/api/health` URL-en `{"status":"UP"}`-ot kell adjon.

### 3) Vercel — frontend (~3 perc)

1. <https://vercel.com/new> → Import GitHub → `verseny-portal`.
2. Vercel automatikusan felismeri a [`vercel.json`](vercel.json)-t:
   - `buildCommand`: `cd frontend && npm install && npm run build`
   - `outputDirectory`: `frontend/dist`
   - `rewrites`: SPA fallback minden nem `/api` route-ra
3. **Environment Variables** (Build + Runtime mindkettő):

| Env var | Érték |
|---|---|
| `VITE_API_URL` | `https://backend-production-9ebe.up.railway.app` (a Railway public URL, **kötőjel nélkül** a végén — a frontend ehhez fűzi a `/api`-t) |
| `VITE_CHATBOT_URL` | (opcionális) ha valaha deployolod a chatbotot is, ide jön az URL-je |

4. **Deploy**. Kapsz egy URL-t (pl. `https://verseny-portal.vercel.app`).

### 4) CORS visszakötés (~1 perc)

Most már van Vercel URL-ed. Vissza Railway-re:

1. `backend` service → **Variables** → `CORS_ORIGINS` = `https://verseny-portal.vercel.app` (több origin esetén vesszővel elválasztva — a backend `application-prod.yml` `${CORS_ORIGINS}`-ot szplit-eli a `CorsConfigurationSource`-ban).
2. Mentés → Railway automatikusan újra-deployol.
3. Várj ~2 percet, próbáld ki a Vercel URL-en: login `admin@portal.hu` / `password`.

### 5) Telefonos PWA-teszt

A Vercel URL HTTPS-en él, Chrome → menü → **Add to Home Screen** → natív appként telepíthető. (A localhost ezt nem kínálja fel, csak az élő HTTPS URL.)

---

## Env var referencia

### Backend (`application-prod.yml`)

| Env | Kötelező? | Default | Mit csinál |
|---|---|---|---|
| `SPRING_DATASOURCE_URL` | igen | — | Postgres JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | igen | — | Postgres user |
| `SPRING_DATASOURCE_PASSWORD` | igen | — | Postgres jelszó |
| `JWT_SECRET` | igen | — | min. 32 byte (HS256-hoz) |
| `CORS_ORIGINS` | igen | `https://localhost:5173` | vesszővel elválasztott origin lista |
| `JWT_EXPIRATION_MS` | nem | `86400000` (1 nap) | token TTL ms-ben |
| `PORT` | nem | `8081` | Railway injektálja |
| `SPRING_PROFILES_ACTIVE` | nem | `prod` (a Dockerfile állítja be) | aktív profil |

### Frontend (Vite build-time env)

| Env | Kötelező? | Default | Mit csinál |
|---|---|---|---|
| `VITE_API_URL` | prod-ban igen, dev-ben nem | `''` (akkor `/api` Vite proxyval) | a backend public origin-je |
| `VITE_CHATBOT_URL` | nem | `http://localhost:8000` | chatbot service origin |

A `.env.example` minta a [`frontend/.env.example`](frontend/.env.example)-ben.

---

## Chatbot deploy (opcionális, jelenleg NINCS aktív)

A `redeploy.ps1` **nem** deployolja a chatbotot. A Vercel-en futó frontend chat oldala figyelmeztet, ha a `VITE_CHATBOT_URL` localhost-ra mutat (production-ben ez azt jelenti hogy a service nincs felhúzva).

Ha akarod, fel tudod húzni Railway-re egy második service-ként:

1. Railway → **+ New** → Empty Service → Settings → Root Directory: `chatbot`. Railway észleli a Dockerfile-t.
2. Variables:

| Env | Érték |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio kulcs |
| `JWT_SECRET` | **ugyanaz**, mint a backend service-nél (a chatbot a monolit tokenjeit validálja) |
| `MONOLITH_BASE_URL` | a backend Railway URL-je (pl. `https://backend-production-9ebe.up.railway.app`) |
| `CORS_ORIGIN` | a Vercel URL (pl. `https://verseny-portal.vercel.app`) |
| `GEMINI_MODEL` | (opcionális) `gemini-2.5-flash` |

3. Deploy után másold a Railway public URL-jét → Vercel-en állítsd `VITE_CHATBOT_URL`-nek és redeployolj.

A chatbot endpoint kontraktusa: `GET /health`, `POST /chat` (`Bearer` JWT-vel a backend-tokeneket fogadja).

---

## Hibakeresés

| Tünet | Megoldás |
|---|---|
| Railway build fail "Cannot find image" | Ellenőrizd hogy a [`backend/Dockerfile`](backend/Dockerfile) committed legyen + a service root directory `backend` |
| Railway health check fail (`/api/health` nem 200) | Railway Logs → tipikus: DB connection error → ellenőrizd a 3 `SPRING_DATASOURCE_*` env vart |
| Login 500 → backend logban "could not find dialect" | A `SPRING_DATASOURCE_URL` valószínűleg `postgresql://`-vel kezdődik a Supabase másolásból — `jdbc:postgresql://` prefix kell |
| Login 500 → "prepared statement S_1 already exists" | A Supabase **transaction pooler**-t használsz a session pooler helyett. JDBC URL-ben a `pooler.supabase.com:5432` (session) kell, nem `:6543` (transaction). |
| Frontend "Network Error" minden API hívásnál | A `VITE_API_URL` rossz, vagy a `CORS_ORIGINS` nem tartalmazza a Vercel domaint pontosan (`https://` prefixszel, trailing slash NÉLKÜL) |
| 401 minden hívásnál login után | A Railway-en a `JWT_SECRET` változott a redeploy között — minden korábbi token érvénytelen lett. Próbálj újra loginnal. |
| "Add to home screen" nem jelenik meg | Csak HTTPS-en (Vercel URL), localhost-on a Chrome nem kínálja fel. |
| Railway free tier — első kérés lassú | A free tier 15 perc inaktivitás után altatja a containert; az első kérés 30–60 mp-ig is eltarthat (Spring Boot cold start). Második kéréstől gyors. |
| Vercel build hibás `VITE_API_URL`-lel | A `VITE_*` env varokat Vercel **build-time-ban** baked be a bundle-be — env var változtatása után **redeploy** kell, frissítés nem elég |

---

## Mi auto-deployol, mi nem

- **`main` push**: Railway (backend) + Vercel (frontend) auto-deploy.
- **Pull request open / preview commit**: Vercel preview deploy minden PR-re egy generált URL-en. Railway-en preview environment nincs konfigurálva.
- **Chatbot**: nincs autodeploy, kézzel kell felhúzni (lásd fent).
- **Adatbázis schema**: `ddl-auto: update`, így a Hibernate startkor hozzáad oszlopot / táblát. Drop NEM történik automatikusan — meglévő oszlop átnevezés / törlés migrációt igényel (jelenleg manuálisan SQL-ben a Supabase SQL Editorral).

A verseny ideje alatt érdemes lehet az auto-deployt kikapcsolni (sok kis commit ⇒ sok Railway / Vercel build vár sorba), és csak a vége előtt 10 perccel egy `.\redeploy.ps1`-gyel felhúzni a végleges állapotot.
