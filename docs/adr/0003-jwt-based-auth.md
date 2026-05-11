# ADR-0003: JWT-alapú stateless authentikáció

**Státusz:** Accepted
**Dátum:** 2026-05-11

## Kontextus

A portálnak több kliense van: webes frontend (React), tervezetten mobilalkalmazás, valamint a chatbot service, amely a felhasználó nevében hív vissza a monolitra. Mindegyiknek egységes authentikációs megoldás kell, ami nem köti meg a backend instance-ot (skálázhatóság, stateless).

## Döntés

A backend JWT bearer tokent ad ki a `/api/auth/login` endpointon. Minden további REST hívás `Authorization: Bearer <token>` headerrel jön. A token tartalmazza a felhasználó id-jét, email-jét és szerepkörét. A Spring Security egy `JwtAuthFilter` segítségével dolgozza fel, a jogosultság minden endpointon `@PreAuthorize` annotációval van kikényszerítve.

## Indoklás

- Stateless backend, vízszintesen szabadon skálázható (nincs session store).
- A chatbot service ugyanazzal a titokkal képes validálni a tokent, így a felhasználó nevében hívhat vissza.
- A frontend egységesen kezeli (axios interceptor), a logout pusztán a kliens oldalon törli a tokent.

## Következmények

**Pozitív:**
- Stateless, skálázható.
- Egységes auth a webes, mobil és chatbot kliensekre.
- A jelszó tárolás BCrypt-tel, a token aláírás HS256-tal történik, mindkettő bevett gyakorlat.

**Negatív, kompromisszum:**
- A token visszavonása nem triviális (kiadás után az expiry-ig érvényes). Mostani döntés: rövid lejárati idő, és kritikus esetben titok rotálás.
- A megosztott szimmetrikus titok kiszivárgása az egész rendszert érinti. Hosszabb távon JWKS endpoint és RS256 kulcspár ajánlott.
- A tokenben tárolt szerepkör elavulhat (ha közben módosítjuk a usert), expiry-ig viszi az elavult adatot.

## Alternatívák

- **Session cookie + szerveroldali session store:** elvetve, mert sticky session vagy közös store kell, és a chatbot-monolith hívásban nehezebb átadni.
- **OAuth2 / OIDC külső identity provider-rel (Keycloak):** elvetve a verseny időkeretében, túl nagy üzembehelyezési overhead. Hosszabb távon megfontolandó.
