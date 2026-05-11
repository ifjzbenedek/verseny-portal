# M — Mobil-specifikus funkciók (PWA ikonok + Geolocation)

> **Indulás előtt**: `git checkout main && git pull`. H ablak párhuzamosan futhat, mert M csak frontend + Event entity bővítést érint, nem nyúl service réteghez.

## Cél

A versenykiírás szerint **extra pont jár** a mobil-specifikus funkcióért (értesítések, kamera, helyadat). Most a PWA konfiguráció be van állítva (`vite-plugin-pwa`), DE:
- A `pwa-192.png` és `pwa-512.png` ikonok **HIÁNYOZNAK** → "Add to Home Screen" nem fog kinézni
- Nincs egyetlen mobil-specifikus API használat sem a kódban

Ez a brief: **PWA ikonok hozzáadása + Geolocation API az Events oldalon**. Az utóbbi mutatja a felhasználó és az események közötti távolságot.

## Branch

```powershell
git checkout main && git pull
git checkout -b feat/mobile-features
```

## Tulajdonolt fájlok

- `frontend/public/pwa-192.png` (új)
- `frontend/public/pwa-512.png` (új)
- `frontend/public/apple-touch-icon.png` (új)
- `frontend/index.html` (apple-touch-icon link)
- `backend/src/main/java/com/verseny/portal/model/Event.java` (latitude/longitude mezők)
- `backend/src/main/java/com/verseny/portal/dto/EventDtos.java` (lat/lng mezők)
- `backend/src/main/java/com/verseny/portal/DataSeeder.java` (BME koordináták a seed eseményekhez — csak az ensureEvent hívások)
- `frontend/src/features/events/EventsPage.tsx` (geolocation gomb + távolság)
- `frontend/src/features/events/api.ts` (lat/lng a TS típusban)
- `frontend/src/features/events/schemas.ts` (lat/lng opcionális Zod)
- `frontend/src/features/events/components/EventForm.tsx` (lat/lng inputok admin-nak)
- `frontend/src/shared/hooks/useGeolocation.ts` (új hook)
- `README.md` (Mobilitás szekció hozzáadása)

## TILOS érinteni

- `chatbot/`
- Bármely másik feature mappa
- Service réteg
- Bármi `controller/`-ben (csak Event model bővít, EventController változatlan marad — H ablak refaktorálja)

## Deliverables

### 1. PWA ikonok (5 perc)

Hozz létre 3 PNG-t a `frontend/public/` alá:
- `pwa-192.png` — 192x192 px
- `pwa-512.png` — 512x512 px
- `apple-touch-icon.png` — 180x180 px

Stílus: sötét kék (#0f172a) háttér, középen fehér "P" betű vagy 🎓 emoji.

**Generálás (válassz egyet)**:

**A) Python + Pillow** (gyors ha van Python):
```python
from PIL import Image, ImageDraw, ImageFont
for size, name in [(192, "pwa-192.png"), (512, "pwa-512.png"), (180, "apple-touch-icon.png")]:
    img = Image.new("RGB", (size, size), "#0f172a")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", int(size*0.6))
    except OSError:
        font = ImageFont.load_default()
    d.text((size/2, size/2), "P", fill="white", anchor="mm", font=font)
    img.save(f"frontend/public/{name}")
```

**B) ImageMagick** (ha telepítve):
```powershell
magick -size 192x192 -background "#0f172a" -fill white -gravity center -font Arial -pointsize 115 label:P frontend/public/pwa-192.png
magick -size 512x512 -background "#0f172a" -fill white -gravity center -font Arial -pointsize 307 label:P frontend/public/pwa-512.png
magick -size 180x180 -background "#0f172a" -fill white -gravity center -font Arial -pointsize 108 label:P frontend/public/apple-touch-icon.png
```

**C) Online generátor**: https://favicon.io/favicon-generator/ — "P" szöveg, dark blue háttér, fehér text, méret 192/512/180, letöltés, mentés a `frontend/public/`-ba.

Verify:
```powershell
cd frontend
npm run build
```
A `dist/manifest.webmanifest` ne mutasson 404-et az ikonokra.

### 2. `index.html` apple-touch-icon

`frontend/index.html`-be a `<head>`-be hozzá:
```html
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### 3. Backend Event entity bővítés

`backend/src/main/java/com/verseny/portal/model/Event.java`:
```java
@Column
private Double latitude;

@Column
private Double longitude;
```

`backend/src/main/java/com/verseny/portal/dto/EventDtos.java`:
- `EventResponse` record-hoz: `Double latitude, Double longitude`
- `EventResponse.from(Event)` mapper-ben: `e.getLatitude(), e.getLongitude()`
- `EventCreateRequest` record-hoz: `Double latitude, Double longitude` (opcionális)
- `Event create()` factory metódusban: `event.setLatitude(req.latitude()); event.setLongitude(req.longitude());`

### 4. DataSeeder koordináták

A DataSeeder `seed()` lambda-ban a 3 `ensureEvent` hívás után seed-eld a koordinátákat. Tegyél egy `setCoordinates` hívást vagy frissítsd a `ensureEvent` signature-ét (egyszerűbb: új helper `ensureEventWithLocation`). Vagy egyszerűen módosítsd a meglévő `ensureEvent` helper-t hogy `latitude`/`longitude` paramétert is fogadjon nullable-ként.

Koordináták (BME körzet):
- Tanévzáró: `47.4731, 19.0598` (Q épület)
- Szülői értekezlet: `47.4731, 19.0598` (Q épület)
- Sportnap: `47.4733, 19.0605` (sportpálya)

### 5. Frontend types + schema bővítés

`frontend/src/features/events/types.ts` (vagy ahol az Event típus van — valószínűleg `api.ts`-ben):
```typescript
export interface EventResponse {
  // existing fields
  latitude: number | null;
  longitude: number | null;
}
```

`frontend/src/features/events/schemas.ts`:
```typescript
export const EventCreateSchema = z.object({
  // existing fields
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});
```

### 6. `useGeolocation` hook

`frontend/src/shared/hooks/useGeolocation.ts`:
```typescript
import { useState, useCallback } from 'react';

export interface GeolocationState {
  position: { latitude: number; longitude: number } | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
  });

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ position: null, error: 'A böngésző nem támogatja a Geolocation API-t.', loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          position: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          error: null,
          loading: false,
        }),
      (err) =>
        setState({
          position: null,
          error: err.code === err.PERMISSION_DENIED ? 'Helymeghatározás megtagadva.' : err.message,
          loading: false,
        }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { ...state, request };
}
```

### 7. Haversine helper

`frontend/src/shared/lib/distance.ts`:
```typescript
export function haversineKm(
  lat1: number, lon1: number, lat2: number, lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
```

### 8. EventsPage bővítés

A `frontend/src/features/events/EventsPage.tsx`-ben:
- Importáld `useGeolocation`, `haversineKm`, `formatDistance`
- A `PageHeader`-be (vagy mellé) egy "Helyzetem" gomb (lucide `MapPin` ikon), `onClick={request}`
- Ha `position` van: a header alá kis szöveg "Helyzeted: 47.4731, 19.0598"
- Ha `error` van: piros toast vagy inline error
- Minden EventCard-on: ha `event.latitude && event.longitude && position`, akkor megjelenik "Távolság: 2.3 km" badge (shadcn `Badge` komponens, ha nincs, sima `<span>` styling-gel)

Code minta a kártya bővítéséhez:
```tsx
{event.latitude !== null && event.longitude !== null && position && (
  <Badge variant="secondary">
    <MapPin className="mr-1 h-3 w-3" />
    {formatDistance(haversineKm(position.latitude, position.longitude, event.latitude, event.longitude))}
  </Badge>
)}
```

### 9. EventForm bővítés (admin-nak)

A `frontend/src/features/events/components/EventForm.tsx`-ben:
- Két új numerikus input: `latitude` és `longitude` (opcionális, helper text: "BME központ: 47.4731 / 19.0598")
- Zod schemával validálva

### 10. README "Mobilitás" szekció

A `README.md` végéhez (vagy a megfelelő helyre) új szekció:

```markdown
## Mobilitás

A webalkalmazás reszponzív felülettel telepíthető PWA-ként Chrome / Safari
"Add to Home Screen" menüből. A frontend mobile-first Tailwind + shadcn/ui
alapokon — minden funkció elérhető mobil és desktop nézetben.

### Mobil-specifikus funkciók

- **Geolocation API** az Események oldalon: a "Helyzetem" gombra kattintva
  a böngésző elkéri a felhasználó helyzetét, és minden esemény mellett
  megjelenik a távolság (Haversine formula).
- **PWA service worker** (`vite-plugin-pwa` autoUpdate mód): offline cache,
  installálható alkalmazás manifesttel + 192/512 px ikonokkal.
- **Apple touch icon** iOS PWA-hoz.

### Tervezett, kihagyott

Külön natív / cross-platform mobil alkalmazás (React Native + Expo) tervben
volt (lásd [TASKS/D-mobile-expo.md](TASKS/D-mobile-expo.md)), de a PWA
megoldás funkcionálisan ugyanazt adja: a Web Notifications API, MediaDevices
(kamera) és Geolocation API mind elérhetők böngészőből.
```

## Definition of Done

- [ ] `frontend/public/pwa-192.png`, `pwa-512.png`, `apple-touch-icon.png` léteznek
- [ ] `npm run build` zöld, `dist/manifest.webmanifest` az ikonokat mutatja és nincs 404 a dev tools network tabján PWA installáláskor
- [ ] `frontend/index.html`-ben az `apple-touch-icon` link
- [ ] Chrome → DevTools → Application → Manifest mutatja a 3 ikont
- [ ] Backend Event entity-ben `latitude` és `longitude` mezők, DTO-ban is, DataSeeder a 3 mintát koordinátákkal seedeli
- [ ] EventsPage-en "Helyzetem" gomb működik (engedélyezés után megjelenik a koord)
- [ ] Eseménykártyán látszik a távolság ha mindkettő (user + event) helyzet ismert
- [ ] EventForm admin-nak van lat/lng input
- [ ] README "Mobilitás" szekció hozzáadva
- [ ] PR main-be

## Smoke teszt

1. `mvn spring-boot:run` és `npm run dev`
2. Browser → login admin → /events
3. "Helyzetem" gomb → engedélyezés → toast/text mutatja a koordot
4. Eseménykártyán "X km" badge megjelenik
5. Admin új eseményt létrehoz lat/lng-vel → kártyán látszik
6. DevTools → Application → Manifest → mind 3 ikon zöld
7. Chrome → URL bar jobb oldalán "Install Portál" gomb látható

## Időkeret

25-30 perc max. Ha az ikonok generálásával gond van (Python/ImageMagick hiányzik), tölts le egy ingyenes 192x192 PNG-t bárhonnan vagy generáld online — **ne ezen menjen el a fél óra**.

## Tipp

- A PNG ikonok tartalma mindegy a versenynek, csak létezzenek és működjenek. Egyszerű "P" betű elég.
- A `navigator.geolocation` HTTP-n is működik dev környezetben localhost-on (production-ben HTTPS kell — de versenyzsűri lokálban tesztel).
- A Haversine formula közelítő (gömb-Föld), 99% pontosság elég városi távolságra.
- A `prefers-color-scheme` már megy a sötét mód miatt — opcionális +1 hogy a manifest `theme_color` egyezzen a dark mode primary color-jával.
