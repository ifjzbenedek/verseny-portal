# G — Integration, QA & Polish (végső fázis)

> **Indulás előtt**: A/B/C/D/E ablakok **összes PR-je merged `main`-be**, CI zöld. F dokumentáció lehet még folyamatban.
> Ez a brief **SZEKVENCIÁLIS**, az utolsó fázis a beadás előtt.

## Cél

Cross-feature integráció ellenőrzése, e2e tesztek, performance audit, accessibility audit, security scan, README polishing, screenshot/screencast készítés, final smoke teszt.

## Branch

```powershell
git checkout main
git pull
git checkout -b feat/integration-qa
```

## Tulajdonolt fájlok

- `e2e/` (új mappa: Playwright tesztek)
- `load-test/` (új mappa: k6 scriptek)
- `README.md` (final polish)
- `docs/screenshots/` (új mappa)
- Bárhol bug fix ha smoke teszten elhasalt

## Deliverables

### 1. Cross-feature integration smoke teszt

Manuálisan végigteszteld minden szerepkört a teljes alkalmazáson:

**HALLGATO** (`hallgato@portal.hu`):
- [ ] Login web-en
- [ ] Dashboard betölt, jegyek + órarend + események láthatók
- [ ] MyGrades: súlyozott átlag korrekt
- [ ] MySchedule: heti nézet rendben
- [ ] Beadandó feltöltés (web): file fel, "submitted" státusz
- [ ] Üzenetküldés egy oktatónak, válasz visszajön
- [ ] Chatbot: "milyen jegyem van matekból?" — releváns válasz
- [ ] Login mobilon (Expo Go-val)
- [ ] Mobil: Push token regisztrálva, beadandó fotó-küldés
- [ ] Mobil: esemény térképen

**OKTATO** (`oktato@portal.hu` vagy `matek.tanar@portal.hu`):
- [ ] Login
- [ ] Tanított tárgyak listája
- [ ] Diák-listából egy diákra → jegy beírása (form validáció működik)
- [ ] Új beírt jegy szerepel a diák saját nézetében
- [ ] Új beadandó kiírása, hallgató lát
- [ ] Beadandó értékelés → Grade auto-rekord (`grading` modul listener)
- [ ] Üzenetküldés hallgatóknak
- [ ] Osztály átlag riport
- [ ] Helyettesítő keresés
- [ ] Jelenlét rögzítése egy órára

**ADMIN** (`admin@portal.hu`):
- [ ] Login
- [ ] User CRUD (új diák felvétele, osztályhoz rendelése)
- [ ] Osztály CRUD
- [ ] Tárgy CRUD
- [ ] SubjectAssignment létrehozása
- [ ] Esemény létrehozás target-szűkítéssel
- [ ] Kérdőív kreálás

**SUPERADMIN** (`superadmin@portal.hu`):
- [ ] Login
- [ ] Admin user CRUD

Bug-okat fixáld helyben (rendszerint commit a `feat/integration-qa` branch-en, ha kis fix; ha nagyobb: külön branch + PR).

### 2. Playwright e2e tesztek

```powershell
mkdir e2e
cd e2e
npm init -y
npm install -D @playwright/test
npx playwright install
```

`e2e/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: { baseURL: 'http://localhost:5173', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: [
    { command: 'cd ../backend && mvn spring-boot:run', url: 'http://localhost:8081/actuator/health', timeout: 120_000, reuseExistingServer: true },
    { command: 'cd ../frontend && npm run dev', url: 'http://localhost:5173', timeout: 60_000, reuseExistingServer: true },
  ],
});
```

`e2e/tests/student-flow.spec.ts`: login → dashboard → grades megnézése → logout
`e2e/tests/teacher-flow.spec.ts`: login → tanított tárgy → diák kiválasztás → jegy beírás
`e2e/tests/admin-flow.spec.ts`: login → új osztály létrehozása → tárgy hozzárendelés
`e2e/tests/dark-mode.spec.ts`: theme toggle persistál refresh után
`e2e/tests/a11y.spec.ts`: `@axe-core/playwright` audit a fő oldalakon

### 3. Lighthouse audit

`e2e/lighthouse.config.js` vagy CLI:

```powershell
npx lighthouse http://localhost:5173 --output=html --output-path=docs/lighthouse-report.html
```

Cél: minden kategória >= 90 (Performance, Accessibility, Best Practices, SEO).

Ha kevesebb: bug-listát írj a README-be "Known issues" alá vagy fixáld.

### 4. k6 load test

```powershell
mkdir load-test
```

`load-test/login-grade.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const loginRes = http.post('http://localhost:8081/api/auth/login',
    JSON.stringify({ email: 'hallgato@portal.hu', password: 'password' }),
    { headers: { 'Content-Type': 'application/json' } });
  check(loginRes, { 'login OK': (r) => r.status === 200 });

  const token = loginRes.json('token');
  const gradesRes = http.get('http://localhost:8081/api/grades/me',
    { headers: { Authorization: `Bearer ${token}` } });
  check(gradesRes, { 'grades OK': (r) => r.status === 200 });

  sleep(1);
}
```

Futtatás: `k6 run load-test/login-grade.js`. Eredményt mentsd `docs/load-test-report.md`-be.

### 5. OWASP ZAP baseline scan

```powershell
docker run --rm -v ${PWD}:/zap/wrk -t owasp/zap2docker-stable zap-baseline.py `
  -t http://host.docker.internal:8081 `
  -r docs/zap-report.html
```

Várt eredmény: csak Low / Info severity. High / Critical megjegyzéseket fixálni vagy "accepted risk" indoklással a `docs/security.md`-be.

### 6. Performance audit

Konkrét mérések:

| Endpoint | Várt p95 | Mért | Akció |
|---|---|---|---|
| `POST /api/auth/login` | < 200ms | | |
| `GET /api/grades/me` | < 100ms | | |
| `GET /api/students?page=0&size=20` | < 150ms | | |
| `POST /api/grades` | < 200ms | | |

N+1 query detektálás:
- Engedélyezd ideiglenesen: `spring.jpa.properties.hibernate.generate_statistics: true`
- Futtass smoke teszteket, nézd a log-ban a query counter-t
- Túl sok query? `@EntityGraph` vagy `JOIN FETCH`

Bundle size audit (frontend):
```powershell
cd frontend
npx vite-bundle-visualizer
```
Cél: kezdő bundle < 250 KB gzipped. Lazy load route-ok szerint ha nagyobb.

### 7. A11y audit (axe-core + manual)

Playwright a11y teszt mindenhova, **plusz** manual:
- Tab-billentyűvel navigálva minden oldal végigjárható
- Screen reader (NVDA / VoiceOver) próba 1-2 oldalon
- Magas kontraszt mód: minden szöveg olvasható
- Form error a screen reader-nek érthető
- ARIA label-ek az ikonokon

### 8. Security checklist final

`docs/security-checklist.md`:
- [ ] BCrypt jelszó
- [ ] JWT lejár 15 perc alatt
- [ ] Refresh token httpOnly cookie (vagy bearer ha még nincs)
- [ ] `@PreAuthorize` minden endpointon (ArchUnit verifikál)
- [ ] CORS csak frontend origin
- [ ] CSP header beállítva
- [ ] XSS védelem: React default escape
- [ ] CSRF: SameSite cookie
- [ ] Rate limit a `/auth/login`-on
- [ ] Sensitive data a logból maszkolva
- [ ] OWASP ZAP scan: csak Low/Info
- [ ] OWASP dependency check: nincs Critical
- [ ] Secret a `.gitignore`-ban (grep történet ellenőrzés: `git log -p | grep -i password` üres)

### 9. README final polish

`README.md` final layout:

```markdown
# Oktatásszervezési Portál

[![CI](badge)] [![Coverage](badge)] [![License](badge)]

> A BME VIK Modern Fullstack és Mobil Fejlesztői Verseny megoldása.

## Screenshotok

![Diák dashboard](docs/screenshots/student-dashboard.png)
![Oktató jegy beírás](docs/screenshots/teacher-grade.png)
![Mobil app](docs/screenshots/mobile.png)

## Tartalom
- [Funkcionalitás](#funkcionalitás)
- [Architektúra](#architektúra)
- [Gyors indítás](#gyors-indítás)
- [Tech stack](#tech-stack)
- [Szerepkör-mátrix](#szerepkör-mátrix)
- [Design decisions](#design-decisions)
- [Mobile app](#mobile-app)
- [Dokumentáció](#dokumentáció)
- [Deployment](#deployment)

## Funkcionalitás

### Kötelező
✅ 4 szerepkör (HALLGATO, OKTATO, ADMIN, SUPERADMIN)
✅ Osztály-tárgy-oktató éves hozzárendelés
✅ Jegyek (normál, témazáró, féléves, év végi)

### Opcionális (mind megvalósítva)
✅ Súlyozott átlagszámítás + osztály statisztikák
✅ Féléves + év végi jegy
✅ Iskolai AI chatbot (RAG, tool use, Claude)
✅ Események + target-szűkítés
✅ Üzenetküldés
✅ Iskola térkép (mobilon helyadattal)
✅ Kérdőív / szavazás
✅ Órarend + jelenlét + helyettesítő keresés
✅ Csoportok (osztályon belül)
✅ Beadandók online (file upload, értékelés → jegy)
✅ Push notification (mobil)
✅ Kamera (mobil)
✅ Helyadat (mobil)
✅ Sötét/világos/magas kontraszt mód
✅ Magyar + angol nyelv

## Architektúra

[C4 Container diagram link]

## Gyors indítás

```powershell
docker-compose up -d
cd backend && mvn spring-boot:run
cd frontend && npm install && npm run dev
```

Default belépés: `password` jelszóval bármelyik seed user.

## Mobile app

```powershell
cd mobile
npm install
npx expo start
```

[Screenshot]

## Dokumentáció

| | |
|---|---|
| Részletes terv | [TERV.md](TERV.md) |
| Architektúra | [docs/architecture/](docs/architecture/) |
| ADR-ek | [docs/adr/](docs/adr/) |
| API ref | [docs/api/](docs/api/) + Swagger UI |
| Runbook | [docs/runbook.md](docs/runbook.md) |
| Error kódok | [docs/error-codes.md](docs/error-codes.md) |
| Szerepkör-mátrix | [docs/role-matrix.md](docs/role-matrix.md) |
| Biztonsági overview | [docs/security.md](docs/security.md) |
```

### 10. Screenshotok / screencast

`docs/screenshots/`:
- `student-dashboard.png`
- `student-grades.png`
- `teacher-grade-entry.png`
- `admin-class-management.png`
- `mobile-dashboard.png`
- `mobile-camera.png`
- `dark-mode.png`
- `chatbot.png`

Opcionális screencast: 30-60 mp Loom vagy hasonló, beágyazva README-be.

### 11. Final commit + tag

```powershell
git add .
git commit -m "chore: final polish, screenshots, e2e tests"
git push origin feat/integration-qa
# PR merge main-be
git checkout main && git pull
git tag -a v1.0.0 -m "Verseny beadás"
git push origin v1.0.0
```

### 12. Beadási checklist

- [ ] GitHub repo public (vagy a megadott zsűri-fiókhoz hozzáférés)
- [ ] README-vel teljes
- [ ] CI zöld a `main` branchen
- [ ] `docker-compose up` kipróbálva tiszta gépen
- [ ] OpenAPI doc elérhető
- [ ] Mobile build tesztelve
- [ ] Screenshot készlet csatolva
- [ ] Tag v1.0.0 létrehozva

## Definition of Done

- [ ] Minden szerepkör smoke teszt zöld
- [ ] Playwright e2e zöld
- [ ] Lighthouse minden kategória >= 90
- [ ] k6 load test eredmény dokumentálva
- [ ] OWASP ZAP baseline: nincs High/Critical
- [ ] N+1 query nincs a hot path-okon
- [ ] Bundle size budget OK
- [ ] A11y axe zöld
- [ ] Security checklist 100%
- [ ] README final layout, screenshotokkal
- [ ] v1.0.0 tag, beadási checklist 100%

## Tipp

- A smoke tesztet csináld a legmagasabb prioritással — ez fogja kihúzni a meglévő bug-okat.
- Ha Lighthouse alacsony: legtöbb gain `loading="lazy"` képeken + code splitting route-onként + brotli compression nginx-ben.
- A k6 test értelmes adatokkal fusson (seed user + valódi grade insert). Mock-olj bele véletlent ha kell.
- A screencast nem kötelező, de a zsűri sokkal hamarabb "megérti" a featureket — ROI magas.
