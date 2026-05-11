# Fogalomtár

A projektben többször visszatérő fogalmak rövid magyarázata. A kódban ezek a nevek egy az egyben megjelennek (entitás, package, controller útvonal).

| Fogalom | Magyarázat |
|---------|------------|
| Osztály (SchoolClass) | Diákok stabil csoportja, akik együtt indultak (például 2024/A). Életciklusa többéves. |
| Csoport (StudentGroup) | Osztályon belüli alcsoport egy adott tárgyra (például haladó angol). Tervezett, a `groups` modulban épül. |
| Tárgy (Subject) | Tantárgy mint absztrakció, név és leírás (például Matematika). |
| Tárgy-hozzárendelés (SubjectAssignment) | Egy konkrét osztály, tárgy, oktató, év négyes. Az oktató joga jegy beírására ezen keresztül érvényesül. |
| Beadandó (Homework) | Egy tárgy keretében az oktató által kiírt feladat. A hallgató Submission-t ad be rá. |
| Jegy (Grade) | Egy értékelés egy hallgatóra, egy tárgy-hozzárendelésre. Értéke 1 és 5 közötti egész, típusa NORMAL, MIDTERM, HALFYEAR vagy YEAR_END, súlya `Double`. |
| Modul (Spring Modulith) | Package-csoport `@ApplicationModule` annotációval, explicit függőség-listával. A build verify ellenőrzi. |
| Hexagonal layering | A modulon belül: `domain/` (tiszta üzleti logika), `application/` (use case-ek), `infrastructure/` (REST controller, JPA repo), `api/` (publikus interfész). |
| RFC 7807 Problem Details | Egységes hibaválasz formátum, `type`, `title`, `status`, `detail`, `instance` mezőkkel. A backend minden hibára ezt adja. |
| Use case | Egy alkalmazási réteg-szintű művelet (`CalculateAverageUseCase`, `FindAvailableSubstitutesUseCase`). Domainből hív, controller hívja. |
