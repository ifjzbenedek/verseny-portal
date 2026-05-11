# D — Mobile (React Native + Expo)

> **Indulás előtt**: [00-FOUNDATION.md](00-FOUNDATION.md) merged `main`-be. `git pull`.
> A backend `http://localhost:8081`-on fut (emulátorból `http://10.0.2.2:8081` Android, vagy LAN IP fizikai eszközre).

## Cél

Új cross-platform mobil alkalmazás `mobile/` mappában React Native + Expo SDK 51+ alapon. **Mobil-specifikus funkciók** miatt **extra pont** a versenyen: push notification, kamera (beadandó fotózás), helyadat (esemény térképen). Megosztott TS típusok a webfrontenddel ahol értelmes.

## Branch

```powershell
git checkout main
git pull
git checkout -b feat/mobile-expo
```

## Tulajdonolt fájlok (kizárólag)

- `mobile/` (új mappa, scratch)
- `README.md` (egy új "Mobile app" szekció hozzáadása)

## TILOS érinteni

- `backend/`
- `frontend/`
- `chatbot/`
- `docker-compose.yml`
- `TERV.md`, `CLAUDE.md`, `TASKS/*`

## Deliverables

### 1. Expo projekt scaffold

```powershell
cd C:\Zozi\8.felev\verseny
npx create-expo-app@latest mobile --template tabs
cd mobile
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install expo-secure-store expo-notifications expo-camera expo-location expo-image-picker expo-device
npm install @tanstack/react-query axios zod react-hook-form @hookform/resolvers zustand
npm install -D typescript @types/react
```

### 2. Mappastruktúra

```
mobile/
├── app.json                        ← Expo config
├── package.json
├── tsconfig.json
├── App.tsx
├── src/
│   ├── api/
│   │   ├── client.ts               ← axios instance
│   │   ├── auth.ts
│   │   ├── grades.ts
│   │   ├── schedule.ts
│   │   ├── homework.ts
│   │   ├── events.ts
│   │   └── messages.ts
│   ├── auth/
│   │   ├── AuthContext.tsx
│   │   ├── ProtectedScreen.tsx
│   │   └── secureStorage.ts        ← expo-secure-store wrapper
│   ├── features/
│   │   ├── login/
│   │   │   └── LoginScreen.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx
│   │   ├── grades/
│   │   │   └── MyGradesScreen.tsx
│   │   ├── schedule/
│   │   │   └── ScheduleScreen.tsx
│   │   ├── homework/
│   │   │   ├── HomeworkListScreen.tsx
│   │   │   └── HomeworkSubmitScreen.tsx   ← kamera/galéria
│   │   ├── events/
│   │   │   ├── EventsScreen.tsx
│   │   │   └── EventMapScreen.tsx         ← location
│   │   ├── messages/
│   │   │   └── MessagesScreen.tsx
│   │   ├── chat/
│   │   │   └── ChatScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── AppNavigator.tsx           ← role-based tabs
│   ├── shared/
│   │   ├── components/                ← Card, Button, Loader, EmptyState, ErrorView
│   │   ├── hooks/
│   │   └── theme/
│   │       ├── ThemeContext.tsx
│   │       └── tokens.ts              ← color, spacing, typography
│   ├── notifications/
│   │   ├── registerForPush.ts
│   │   └── handler.ts
│   └── types/
└── assets/
    └── (icons, splash)
```

### 3. Theme

- Light + dark mód (`useColorScheme` + manual override `expo-secure-store`-ban)
- React Native Paper opcionálisan ha gyorsabb (`npm install react-native-paper react-native-safe-area-context`)
- Magas kontraszt mód opcionálisan

### 4. Auth

`auth/AuthContext.tsx`:
- Token storage: `expo-secure-store` (sosem AsyncStorage tokenre)
- JWT decode (light JWT decoder lib vagy manuális base64)
- Login screen: prefilled demo credentials (gyors zsűri teszt)
- Auto-redirect ha érvényes token

### 5. Navigation

- `RootNavigator`: switch `AuthNavigator` vs `AppNavigator` (auth state alapján)
- `AppNavigator`: bottom tab navigator role alapján
  - HALLGATO: Dashboard, Jegyek, Órarend, Beadandók, Üzenetek, Chat
  - OKTATO: Dashboard, Tanítás (jegybeírás), Órarend, Üzenetek
  - ADMIN: nem mobilra optimalizált — alap nézet a felhasználói lista, redirect a webre admin funkciókhoz
- Mindenki: Profil/Beállítások

### 6. Képernyők — kötelező funkciók

#### LoginScreen
- Email + password input
- Demo credentials gomb (3-4 prefilled tap)
- Backend: `POST /api/auth/login`
- Tárolás SecureStore-ba

#### DashboardScreen (HALLGATO)
- Legutóbbi jegyek (3-4 db)
- Mai órarend
- Közelgő események
- Olvasatlan üzenet badge

#### MyGradesScreen (HALLGATO)
- Tárgyanként súlyozott átlag
- Jegy lista típus + súly + dátum
- Húzd-le-frissítés (pull-to-refresh)

#### ScheduleScreen
- Heti nézet (7 nap, lehúzható lista)
- Mai óra kiemelve
- Slot tap → részletek (terem, oktató, helyettesítés ha van)

### 7. Mobil-specifikus funkciók (EXTRA PONTOK!)

#### Push notification (Expo Notifications)
- `registerForPushNotificationsAsync()` — permission + expo push token
- Token elküldése a backend-nek (`POST /api/users/me/push-token` — Window A backend modulnak kell hozzáadnia, koordinálj)
- Frontend: `Notifications.addNotificationReceivedListener` foreground-ban toast/banner
- Use case: új jegy beírásakor → backend push notification a diáknak
- Konkrét megvalósításhoz a backend Window A-nak kell egy `notifications` modulja, ami az Expo Push API-t hívja. Ha ez nincs kész: **legalább a frontend oldal regisztrálja és tárolja a tokent, mock notification toggle a Settings-ben "Demo push" gombbal**.

#### Kamera (Beadandó fotózása)
- `expo-camera` vagy `expo-image-picker`
- HomeworkSubmitScreen: "Fotó beadandóhoz" gomb → kamera nyit / galéria → kép preview → submit
- Multipart upload `POST /api/homework/{id}/submissions`
- Loading + success/error state

#### Helyadat (Esemény térképen)
- `expo-location` permission
- EventsScreen: lista mellett "Térkép" tab
- `react-native-maps` (Expo-kompatibilis): marker minden eseménynek koordinátával
- Esemény tap → részletek + saját helyzettől távolság
- Ha az `Event` entity nincs `latitude`/`longitude` mezővel, jelez Window A-nak, addig statikus iskola-koordinátát mutass

### 8. ChatScreen (chatbot UI mobilon)

- Üzenetlista (FlatList, inverted=true)
- Input + küldés gomb
- SSE consume EventSource alternatívával: `react-native-event-source` vagy axios stream
- Streaming válasz token-by-token megjelenítés
- Hívja a `chatbot/` service-t (`http://<host>:8000/chat/stream`) a felhasználó JWT-jével

### 9. Networking

- axios + interceptor
- baseURL config: `mobile/.env.local` vagy `app.config.ts`-ben `extra` mező
- Token auto-attach
- 401 → logout + auth screen
- Offline detect (NetInfo)

### 10. TanStack Query

- QueryClient setup
- Cache + retry policy
- Pull-to-refresh = `refetch()`

### 11. App ikonok és splash

- Egyszerű "P" logó az `assets/` alá (használhatsz placeholder ikont)
- Splash screen szín + ikon `app.json`-ban

### 12. Tesztek (opcionális, ha fér)

- `@testing-library/react-native` egy-két komponens-tesztre
- Maestro `.yaml` flow: login → grades → logout — ha van idő

### 13. Build útmutató

`README.md`-be új "Mobile app" szekció:
- `cd mobile && npm install`
- `npx expo start` → QR kód mobiltelefonra (Expo Go app)
- Telefon és gép ugyanazon LAN
- `EXPO_PUBLIC_API_URL=http://192.168.x.x:8081` `.env.local`-ban
- Production build útmutató (EAS Build említve, de NEM kötelező)

## Definition of Done

- [ ] `npx expo start` hibátlan indulás
- [ ] Expo Go-val telefonon megnyílik
- [ ] Login működik a 3 demo userrel
- [ ] HALLGATO látja a saját jegyeit
- [ ] Push notification regisztráció működik (token megjelenik a log-ban)
- [ ] Kamera képet készít, és próbál feltölteni (akár sikertelenül ha backend endpoint még nincs)
- [ ] Location permission és aktuális koordináta lekérdezhető
- [ ] Sötét/világos téma vált
- [ ] PR `main`-be, CI zöld

## Koordináció más ablakokkal

- **Window A**: szükségem van rá:
  - `POST /api/users/me/push-token` endpoint (push token regisztrálása)
  - `notifications` modul amelyik hív Expo Push API-t event esetén
  - `Event` entity-n `latitude`, `longitude` mezők
  - Multipart file upload a beadandóhoz (megvan-e?)
- **Window C**: a chatbot service URL-jét és SSE formátumát egyeztetni
- **Window B**: a web frontend és a mobil **megosztott TypeScript típusokon** dolgozhat — ha `shared-types/` package készül, használd; ha nem, duplikáld a típusokat

## Tipp

- Tesztelj fizikai eszközön ha lehet — emulátor lassú, push notification emulátorban nem mindig működik.
- `expo-camera` Android-on permission-csapdák gyakori — mindig kérj engedélyt `useEffect`-ben mount-kor.
- Reszponzív tipográfia: `react-native-size-matters` vagy `useWindowDimensions`.
- SafeAreaView mindenhol.
