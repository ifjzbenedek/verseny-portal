# B — Frontend web (React + shadcn/ui + feature-folder)

> **Indulás előtt**: [00-FOUNDATION.md](00-FOUNDATION.md) merged `main`-be. `git pull`.
> Backend endpointokra építesz amiket Foundation létrehozott (lásd `http://localhost:8081/swagger-ui.html`).

## Cél

A meglévő frontend újrastrukturálása **feature-folder** szerkezetbe, **shadcn/ui** komponenskönyvtárral, **TanStack Query**-vel server state-re, **Zod**-dal runtime validációra. Implementáld a 4 szerepkör (HALLGATO, OKTATO, ADMIN, SUPERADMIN) dashboardjait és az összes UI-t a backend funkciókhoz. Sötét/világos mód + accessibility.

## Branch

```powershell
git checkout main
git pull
git checkout -b feat/frontend-redesign
```

## Tulajdonolt fájlok (kizárólag)

- `frontend/` minden alatta
- (új) `frontend/.eslintrc.json`, `frontend/.prettierrc`, `frontend/components.json`

## TILOS érinteni

- `backend/`
- `chatbot/` (Window C)
- `mobile/` (Window D)
- `docker-compose.yml`
- `TERV.md`, `CLAUDE.md`, `TASKS/*`

## Deliverables

### 1. Function dependencies

```powershell
cd frontend
npm install @tanstack/react-query @tanstack/react-query-devtools zod react-hook-form @hookform/resolvers
npm install -D tailwindcss postcss autoprefixer @types/node
npx tailwindcss init -p
```

Tailwind config + shadcn/ui setup:
```powershell
npx shadcn@latest init
# stílus: default, base color: slate, CSS variables: yes
npx shadcn@latest add button card input form table dialog dropdown-menu select toast badge avatar tabs sheet
```

UI ikonok:
```powershell
npm install lucide-react
```

Toaster:
```powershell
npm install sonner
```

I18n (HU+EN):
```powershell
npm install react-i18next i18next i18next-browser-languagedetector
```

### 2. Feature-folder struktúra

Refactor az `src/` tartalmát:

```
frontend/src/
├── main.tsx
├── App.tsx                          ← csak Router + QueryClientProvider
├── shared/
│   ├── api/
│   │   └── client.ts                ← axios instance (megtartani a meglévőt)
│   ├── components/                  ← shadcn/ui komponensek (auto-generált)
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   │   └── utils.ts                 ← shadcn `cn()` helper
│   └── types/
├── auth/
│   ├── AuthContext.tsx              ← meglévő, frissítsd a TanStack Query-vel
│   ├── ProtectedRoute.tsx
│   ├── RoleGuard.tsx                ← új: <RoleGuard allow={['ADMIN']}>
│   └── api.ts                       ← login/register mutations
├── features/
│   ├── dashboard/
│   │   ├── pages/
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── SuperAdminDashboard.tsx
│   │   └── components/
│   ├── grades/
│   │   ├── api/                     ← TanStack Query hooks
│   │   ├── components/              ← GradeTable, GradeForm, AverageChart
│   │   ├── pages/                   ← MyGradesPage, RecordGradePage, ClassAveragesPage
│   │   └── schemas.ts               ← Zod
│   ├── subjects/
│   ├── classes/
│   ├── users/
│   ├── schedule/
│   ├── messaging/
│   ├── events/
│   ├── homework/                    ← beadandók
│   ├── groups/
│   ├── surveys/
│   ├── chat/                        ← chatbot UI (Window C service-éhez)
│   └── settings/                    ← theme, language
├── i18n/
│   ├── index.ts
│   ├── hu/
│   │   ├── common.json
│   │   └── grades.json
│   └── en/
│       └── ...
└── styles/
    └── globals.css                  ← Tailwind directives, CSS variables
```

A meglévő `Dashboard.tsx`, `Courses.tsx` ne tűnjön el — adjuk át a `legacy/` alá, mint referenciamintát.

### 3. Auth refactor

`auth/AuthContext.tsx`: Token storage `localStorage`-ban (refresh tokenhez httpOnly cookie kellene majd a backendtől, de most marad bearer). User object dekódolva a JWT-ből (id, email, role).

`shared/api/client.ts` (axios):
- Bearer interceptor
- 401 esetén logout + redirect /login
- baseURL: `import.meta.env.VITE_API_URL || 'http://localhost:8081'`

### 4. Routing (App.tsx)

```tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route index element={<DashboardRouter />} />  // role alapján redirect
    <Route path="grades/*" element={<GradesRoutes />} />
    <Route path="subjects/*" element={<RoleGuard allow={['ADMIN','SUPERADMIN','OKTATO','HALLGATO']}><SubjectsRoutes /></RoleGuard>} />
    <Route path="classes/*" element={<RoleGuard allow={['ADMIN','SUPERADMIN','OKTATO']}><ClassesRoutes /></RoleGuard>} />
    <Route path="users/*" element={<RoleGuard allow={['ADMIN','SUPERADMIN']}><UsersRoutes /></RoleGuard>} />
    <Route path="schedule/*" element={<ScheduleRoutes />} />
    <Route path="messages/*" element={<MessagingRoutes />} />
    <Route path="events" element={<EventsPage />} />
    <Route path="homework/*" element={<HomeworkRoutes />} />
    <Route path="chat" element={<ChatPage />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
</Routes>
```

### 5. AppLayout

- Reszponzív sidebar (mobile-on `Sheet`, desktop-on fix)
- Top bar: user avatar, theme toggle (sötét/világos/system), language switcher (HU/EN), logout
- Aktív szerepkör badge
- Mobil bottom nav opcionálisan

### 6. Szerepkör-specifikus UI

#### HALLGATO
- Dashboard: legutóbbi jegyek, mai órarend, közelgő események, ki nem olvasott üzenetek
- `MyGrades`: tárgyanként súlyozott átlag, jegy lista típussal és súllyal
- `MySchedule`: heti órarend
- `MyHomework`: beadandó lista, feltöltés (drag-and-drop)
- `Events`
- `Messages`: oktató-listával, kiválasztva beszélgetés
- `Chat`: chatbot UI

#### OKTATO
- Dashboard: tanított tárgyak, mai óráim, ki nem olvasott üzenetek, javítandó beadandók
- `Teaching`: tanított assignmentek listája → drill-down osztály diák-lista → jegy beírás
- `RecordGrade` modal: érték (1-5), type (legördülő), weight (súly), comment
- `ClassAverage` nézet: osztály diák-listája átlaggal, hisztogram
- `Substitute`: szabad helyettesítő keresése (időpont megadása → szabad oktatók listája)
- `Attendance`: jelenlét rögzítése slot/dátumra

#### ADMIN
- Dashboard: rendszer statisztikák (user count, osztály count, stb.)
- `Users`: CRUD diákok, oktatók
- `Classes`: CRUD osztály, diák-hozzárendelés
- `Subjects`: CRUD tárgyak
- `Assignments`: osztály-tárgy-oktató-év hozzárendelés
- `Schedule`: ScheduleSlot CRUD
- `Events`: esemény létrehozás target-szűkítéssel
- `Surveys`: kérdőív kreálás

#### SUPERADMIN
- Mint ADMIN, plusz: admin user CRUD, system settings

### 7. Komponens-minták

#### Adattábla
- `shared/components/DataTable.tsx`: TanStack Table-ből vagy egyszerűbb shadcn-table + pagination + search + sort
- Skeleton loader
- Empty state komponens
- Error boundary mindenhova

#### Form
- React Hook Form + Zod resolver
- Inline error message
- Disabled state submitting közben
- Success toast (sonner)

#### Példa: jegy beírás
```tsx
const schema = z.object({
  value: z.number().int().min(1).max(5),
  type: z.enum(['NORMAL','MIDTERM','HALFYEAR','YEAR_END']),
  weight: z.number().positive(),
  comment: z.string().max(1000).optional()
});
```

### 8. Sötét / világos / magas kontraszt mód

`shared/hooks/useTheme.ts`:
- `'light' | 'dark' | 'high-contrast' | 'system'`
- localStorage persist
- `prefers-color-scheme` figyel system módban
- Tailwind `dark:` osztály + custom `[data-theme="high-contrast"]` szelektor a `globals.css`-ben

### 9. I18n

`react-i18next` setup, language detector, HU default, EN fallback (csak alap fordításokkal).

`useTranslation` minden komponensben string helyett.

### 10. A11y

- Minden interaktív elem keyboard-elérhető
- ARIA label-ek
- Focus indicator látható
- Color contrast WCAG AA minimum
- Form error `aria-describedby`
- `axe-core` install + `vitest`-tel teszt 1-2 oldalon

### 11. Tesztek

- Vitest + React Testing Library setup
- Komponens teszt: 1 form, 1 lista, 1 guard
- `jest-axe` 1-2 oldalon
- (Opcionális) Playwright: 1 happy path (login → student dashboard → grade megnézése)

### 12. ESLint + Prettier + pre-commit

- ESLint config: TS + React strict
- Prettier config: 2 spaces, single quotes, trailing comma
- `lint-staged` + `husky` pre-commit hook a `frontend/`-re

### 13. Vite proxy fix

`vite.config.ts`: `/api` proxy `http://localhost:8081`-re ha még nincs.

### 14. README frontend szekció

`README.md`-be "Frontend" szekció: futtatás, feature-folder szerkezet rövid leírása, theme/i18n toggle hely.

## Definition of Done

- [ ] `npm run build` zöld, nincs TS hiba
- [ ] `npm run lint` zöld
- [ ] `npm run test` zöld
- [ ] Login működik, role-alapú dashboard megjelenik
- [ ] HALLGATO látja a saját jegyeit, súlyozott átlaggal
- [ ] OKTATO be tud írni jegyet (form validáció működik)
- [ ] ADMIN tud osztályt/tárgyat létrehozni
- [ ] Sötét/világos toggle működik, persistál
- [ ] HU/EN language switch működik
- [ ] Mobil-reszponzív (Chrome DevTools mobile view jól néz ki)
- [ ] PR `main`-be, CI zöld

## Tipp

- A `Courses.tsx` mintát hagyd meg `legacy/` alatt referenciaként.
- Ne foglalkozz a chatbot UI tényleges backend integrációjával — Window C csinálja a service-t, a chat UI használhat egy mock-ot fejlesztés közben (`localStorage`-ből üzenetek).
- shadcn/ui mindig másol fájlokat — ha nem tetszik, módosíthatod.
