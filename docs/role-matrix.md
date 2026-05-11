# Szerepkör mátrix

Ez a táblázat a portál fő funkcióit veti össze a négy szerepkörrel. ✅ jelentése: van hozzáférés. ❌ jelentése: tiltott. A részleges hozzáférést a megjegyzés magyarázza.

| Funkció | HALLGATO | OKTATO | ADMIN | SUPERADMIN |
|---------|----------|--------|-------|------------|
| Saját jegyek megtekintése | ✅ | n/a | ✅ (bárkié) | ✅ |
| Jegy beírása | ❌ | ✅ (csak saját tárgyra) | ❌ | ❌ |
| Jegy módosítása, törlése | ❌ | ✅ (csak saját jegy) | ✅ | ✅ |
| Osztály átlag számítása | ❌ | ✅ (saját tárgyra) | ✅ | ✅ |
| Tárgy CRUD | ❌ | ❌ | ✅ | ✅ |
| Osztály CRUD | ❌ | ❌ | ✅ | ✅ |
| Tárgy-hozzárendelés (osztály, tárgy, oktató, év) | ❌ | ❌ | ✅ | ✅ |
| Saját órarend megtekintése | ✅ | ✅ | ✅ | ✅ |
| Órarend létrehozása | ❌ | ❌ | ✅ | ✅ |
| Jelenlét rögzítése | ❌ | ✅ | ✅ | ✅ |
| Beadandó feltöltése | ✅ | ❌ | ❌ | ❌ |
| Beadandó kiírása és értékelése | ❌ | ✅ (saját tárgyra) | ❌ | ❌ |
| Esemény létrehozása | ❌ | ❌ | ✅ | ✅ |
| Üzenet küldése, fogadása | ✅ (oktatóval) | ✅ (hallgatóval) | ✅ | ✅ |
| Kérdőív létrehozása | ❌ | ❌ | ✅ | ✅ |
| Kérdőív kitöltése | ✅ (ha cél) | ✅ (ha cél) | ✅ (ha cél) | ✅ |
| Felhasználó (HALLGATO, OKTATO) CRUD | ❌ | ❌ | ✅ | ✅ |
| Admin felhasználó CRUD | ❌ | ❌ | ❌ | ✅ |
| Chatbot használata | ✅ | ✅ | ✅ | ✅ |

## Megjegyzés

A finomabb szabályok (például "az oktató csak a saját tárgyához rendelt osztály diákjainak írhat jegyet") nem férnek bele egy mátrixba, ezeket a controller szintű `@PreAuthorize` kifejezések és use case logika kényszerítik ki.
