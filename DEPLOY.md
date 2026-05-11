# Deploy útmutató — Supabase + Render + Vercel

Cél: a versenyprojekt felhőben futtatható demo URL-ekkel.
- **Frontend (PWA)** → Vercel: `https://verseny-{neved}.vercel.app`
- **Backend (Spring Boot)** → Render: `https://verseny-backend.onrender.com`
- **Postgres** → Supabase

Sorrend kötött: **DB → Backend → Frontend** (mindegyik az előzőre épül).

---

## 1) Supabase Postgres (5 perc)

1. https://supabase.com/dashboard → **New project**
2. Project name: `verseny`, DB password: **mentsd el** (a Render-be kell), region: `Frankfurt` (EU)
3. Várj 1-2 percet amíg kiépül
4. **Project Settings → Database → Connection string** → **Session pooler** fül (NEM "Direct connection", NEM "Transaction pooler")
   - Miért session pooler: Render IPv4-en csatlakozik, a direct connection IPv6-only; a transaction pooler nem támogatja a prepared statement-eket, amiket JPA használ.
5. Másold ki a 3 értéket:
   - **URL**: `jdbc:postgresql://aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
   - **Username**: `postgres.xxxxxxxxxxxx` (a projekt-ref)
   - **Password**: amit az 2. lépésben elmentettél

---

## 2) GitHub repo (2 perc)

A verseny mappából:
```powershell
cd C:\Zozi\8.felev\verseny
git init
git add .
git commit -m "Initial boilerplate + deploy config"
gh repo create verseny-portal --private --source=. --remote=origin --push
```

(Ha nincs `gh` CLI: github.com → New repository → kövesd az utasításokat a `git remote add` + `git push -u origin main` parancsokkal.)

---

## 3) Render — Spring Boot deploy (5 perc)

1. https://dashboard.render.com → **New → Blueprint**
2. Connect GitHub → válaszd a `verseny-portal` repót
3. Render észleli a `render.yaml`-t → "Apply"
4. A web service létrejön, **DE 3 env var nincs beállítva** (`sync: false`-szal jelöltük). Töltsd ki:
   - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://aws-0-eu-central-1.pooler.supabase.com:5432/postgres` (a Supabase-ből)
   - `SPRING_DATASOURCE_USERNAME` = `postgres.xxxxxxxxxxxx`
   - `SPRING_DATASOURCE_PASSWORD` = a Supabase DB jelszó
   - `CORS_ORIGINS` = **egyelőre hagyd üresen**, a Vercel URL után állítsuk be
5. **Manual Deploy → Deploy latest commit**
6. Várj ~5 percet (első build hosszabb a Maven dependency-letöltés miatt)
7. Health check: `https://verseny-backend.onrender.com/api/health` → `{"status":"UP"}`

> **Render free tier**: 15 perc inaktivitás után aludni megy; első kérés a felébredés után 30-60 mp lehet. Verseny végén ezt érdemes a bíróknak előre szólni: "első kérés lassú, utána gyors".

---

## 4) Vercel — frontend deploy (3 perc)

1. https://vercel.com/new → Import GitHub → `verseny-portal`
2. Vercel észleli a `vercel.json`-t és a frontend almappát
3. **Environment Variables** (Build & Runtime mindkettő):
   - `VITE_API_URL` = `https://verseny-backend.onrender.com` (a Render URL, **kötőjel nélkül a végén**)
4. **Deploy**
5. Várj ~1 percet → kapsz egy URL-t, pl. `https://verseny-portal-zozi.vercel.app`

---

## 5) Backend ↔ Frontend összekötése (CORS, 1 perc)

Most már megvan a Vercel URL. Vissza Render-re:
1. Service → **Environment** → `CORS_ORIGINS` = `https://verseny-portal-zozi.vercel.app` (a Vercel URL pontosan)
2. **Save** → automatikus redeploy
3. Várj ~2 percet, próbáld ki a Vercel URL-en: login `admin@portal.hu` / `password`

---

## 6) Telefonos PWA-teszt

A Vercel URL-en `https://...vercel.app` (HTTPS!) megnyitod telefonon → Chrome menü → **"Add to home screen"** → tényleg natív appként megjelenik.

---

## Hibakeresés

| Tünet | Megoldás |
|---|---|
| Render build fail "Cannot find image" | Ellenőrizd hogy a `backend/Dockerfile` committed legyen |
| Render health check fail | Nézd a Render Logs-ot. Tipikus: DB connection hibás — ellenőrizd a 3 SPRING_DATASOURCE_* env vart |
| Frontend "Network Error" minden API-híváskor | A `VITE_API_URL` rossz, vagy a CORS_ORIGINS nem tartalmazza a Vercel domaint |
| Login 500-as → backend logban "could not find dialect" | Supabase URL valószínűleg `postgresql://` és nem `jdbc:postgresql://` — prefixet javítsd |
| "Add to home screen" nem jelenik meg | Telefon böngészőjében nyitsd HTTPS-en. A localhost IP-n nem megy, csak Vercel URL-en. |

---

## Mit deployolj a verseny közben?

A repo-be `git push origin main` → mindkét deploy (Render + Vercel) automatikusan újra-deployol. Ez azt jelenti hogy verseny közben commit-onként frissül a felhő. Ha sok kis commit van és sok Render-build vár sorba, kapcsold ki az auto-deployt és csak a vége előtt 10 perccel kapcsold vissza.
