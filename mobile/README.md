# Verseny portál, Android kliens (Capacitor)

A `frontend/` (Vite + React) buildjét Capacitor-ral csomagoljuk natív Android shell-be. Ugyanazt a kódbázist használja, mint a webes verzió, plusz natív plugin elérés (push, kamera, helyi notifik, splash).

## Mappa szerkezet

```
mobile/
  android/             Capacitor által generált Android Studio projekt
  capacitor.config.ts  app id, név, webDir, plugin beállítások
  package.json         Capacitor függőségek
  scripts/
    build-and-sync.ps1 frontend build + cap sync egyben
```

## Előfeltételek

- Node.js 18+, npm
- JDK 17, beállított `JAVA_HOME`
- Android Studio + Android SDK 34, beállított `ANDROID_HOME`
- Egy fizikai Android eszköz USB debug módban, vagy egy emulátor (AVD)

## API URL beállítás

A frontend a `VITE_API_URL` env változóból olvassa a backend címét. Mobil buildhez **NEM** localhost kell:

- **Android emulátor (AVD), backend a host gépen:** `http://10.0.2.2:8080`
- **Fizikai eszköz, backend a LAN-on:** pl. `http://192.168.1.42:8080`
- **Production deploy:** `https://verseny.example.com`

A build előtt állítsd be a frontend `.env.production` vagy `.env.mobile` fájlt, vagy a parancssorban add át.

## Build, dev workflow

```powershell
# 1. Egyszeri init (csak első alkalommal)
npm install
# Android platform már hozzá van adva (lásd android/ mappa).

# 2. Frontend build mobilra
cd ../frontend
$env:VITE_API_URL = "http://10.0.2.2:8080"
npm run build
cd ../mobile

# 3. Web assets másolása az Android projektbe
npx cap sync android

# 4. Futtatás
npx cap run android        # ha emulator/eszköz csatlakozik
# vagy
npx cap open android       # Android Studio-ban megnyitva
```

Vagy egy lépésben a kényelmes scripttel:

```powershell
./scripts/build-and-sync.ps1 -ApiUrl "http://10.0.2.2:8080"
```

## APK készítés CLI-ből

```powershell
./scripts/build-and-sync.ps1 -ApiUrl "https://verseny.example.com"
cd android
./gradlew.bat assembleDebug
# az APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## Telepített Capacitor plugin-ok

| Plugin | Funkció |
|---|---|
| `@capacitor/app` | Lifecycle eseményekkel mobil-specifikus háttér |
| `@capacitor/camera` | Natív kamera API, fotó vagy galéria választás |
| `@capacitor/local-notifications` | Helyi notifik ütemezése (pl. teendő emlékeztető) |
| `@capacitor/push-notifications` | FCM push, ehhez `google-services.json` kell |
| `@capacitor/splash-screen` | Indítás közbeni splash |
| `@capacitor/status-bar` | Status bar szín, stílus |

A plugin-ok a frontend kódból is hívhatóak (`import { Camera } from '@capacitor/camera'`). Webnézetben Capacitor automatikusan a böngésző-megfelelő implementációt használja, natívon a Java/Kotlin oldali API-t.

## Push notification, opcionális

A `@capacitor/push-notifications` plugin működéséhez:

1. Firebase projekt létrehozása, FCM engedélyezve
2. `google-services.json` letöltése, helyezd ide: `android/app/google-services.json`
3. Engedélyezés a `MainActivity` vagy `AndroidManifest.xml`-ben (Capacitor automatikusan kezeli)
4. Backend oldal: FCM Admin SDK, vagy bármilyen HTTP push küldés

## Ismert korlátok, TODO

- `google-services.json` még nincs, push csak akkor működik, ha hozzáadod
- Splash screen ikont/színt a `android/app/src/main/res/`-be testreszabhatod (`splash.xml`, `colors.xml`)
- App ikont az `android/app/src/main/res/mipmap-*` mappákban cseréld le, vagy generálj sajátot Android Studio Asset Studio-val
- `capacitor.config.ts` `appId` jelenleg `hu.bme.verseny`, Play Store-hoz egyedi reverse-DNS-t használj
