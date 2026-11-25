# Kontrakt zamówień demonstracyjnych — v1

Uzgodniony 16.11.2026. Backend przygotowany przez asystenta; frontend nadal
zatwierdza lokalnie. Integracja frontendowa jest zadaniem następnej sesji.
Zmiany nie są automatycznie wdrożone na VPS po zapisaniu plików ani pushu.

## Zakres i dane demo

Bez kont, płatności, rezerwacji stanu magazynowego, e-maili, faktur i adresów.
Kurier to symulacja, nie prawdziwe zlecenie wysyłki. Nie podawaj prawdziwych danych.
Serwer przyjmuje wyłącznie adresy e-mail z domeną kończącą się na .test, .invalid
lub .example, np. demo@example.test. Nie przechowuje ani nie zwraca imienia/e-maila;
obejmuje je jednokierunkowy skrót normalizowanego żądania do idempotencji.

SQLite przechowuje podsumowanie, skrót żądania, klucz i termin ważności.
Rekordy wygasają po 24 godzinach. Są usuwane przy uruchomieniu, przed zapisem
oraz co minutę podczas działania API (najpóźniej pierwszy cykl po terminie).
Gdy API jest wyłączone, usuwanie nastąpi przy kolejnym uruchomieniu.
secure_delete włączone; retencja nie usuwa zewnętrznych kopii/backupów dysku.
Demo nie tworzy backupów zamówień. Brak publicznego odczytu/listy zamówień.

## Żądanie

`POST /api/orders`, `Content-Type: application/json`, maksymalnie 16 KiB w Kestrel.
Wymagany nagłówek `Idempotency-Key`: losowy UUID w zapisie z myślnikami,
np. wynik `crypto.randomUUID()` w przeglądarce.

```json
{
  "customerName": "Demo",
  "email": "demo@example.test",
  "deliveryMethodId": "pickup",
  "pickupPoint": "DEMO01",
  "items": [
    { "variantId": 202, "quantity": 1 }
  ]
}
```

- customerName: string, trim, 1–80 znaków, bez znaków sterujących.
- email: string, trim, poprawny format, maks. 254 znaków, fikcyjna domena powyżej.
- deliveryMethodId: dokładnie pickup lub courier.
- pickupPoint: pickup wymaga kodu po trim, 1–30 znaków ASCII: litery/cyfry/myślnik.
  Dla courier null, brak pola albo pusty tekst; niepusty kod to błąd.
- items: 1–20 różnych wariantów. variantId: dodatnia liczba całkowita;
  quantity: całkowita 1–10. Duplikaty ID są błędem, klient scala pozycje.
- Nie wysyłamy cen, nazw produktów, productId ani sum. Dodatkowe pola są ignorowane,
  nigdy nie wpływają na wycenę. API znajduje produkt na podstawie wariantu.
- Kolejność pozycji jest normalizowana po variantId; teksty są trimowane.

Pickup kosztuje 9,99 EUR, kurier 14,99 EUR. Od sumy produktów **>= 200 EUR**
obie metody są bezpłatne. Cena pozycji pochodzi z wariantu, nie ceny bazowej produktu.
Serwer używa decimal; JSON zawiera liczby, frontend formatuje je jako walutę.

## Sukces

Nowe zamówienie: `201 application/json`. Powtórzenie identycznego żądania:
`200 application/json`, ten sam dokument, numer i czas. Cache-Control: no-store.
Nagłówek `Idempotency-Replayed`: false dla nowego, true dla powtórzonego.
Nie ma Location ani endpointu GET służącego pobraniu zamówienia.

```json
{
  "orderId": "DEMO-00000000000000000000000000000000",
  "createdAt": "2026-11-16T20:00:00+00:00",
  "expiresAt": "2026-11-17T20:00:00+00:00",
  "isDemo": true,
  "currency": "EUR",
  "items": [{
    "productId": 1,
    "variantId": 202,
    "name": "Bransoletka Aura",
    "size": "M",
    "unitPrice": 94.50,
    "quantity": 1,
    "lineTotal": 94.50
  }],
  "totalQuantity": 1,
  "totalPrice": 94.50,
  "deliveryMethodId": "pickup",
  "deliveryName": "Punkt odbioru",
  "deliveryPrice": 9.99,
  "pickupPoint": "DEMO01",
  "grandTotal": 104.49
}
```

Numer jest losowy; przykład powyżej nie jest rzeczywistym numerem.
Podsumowanie jest migawką wyceny chwili utworzenia, nie późniejszego katalogu.

## Błędy

Błędy aplikacji to `application/problem+json`. Pola status, title i kod `code`
służą rozpoznaniu błędu; nie opieramy logiki na dokładnym tekście komunikatu.
Walidacja zawiera errors: obiekt klucz -> tablica komunikatów.

| Status | code | Znaczenie |
| --- | --- | --- |
| 400 | invalid_idempotency_key | Brak/poprawny format klucza wymagany |
| 400 | validation_failed | Nieprawidłowe dane, ilość, duplikaty, dostawa |
| 400 | invalid_request | Niepoprawny JSON/typy; niektóre błędy protokołu mają tylko standardowe ProblemDetails |
| 409 | items_unavailable | Brak wariantu lub wariant niedostępny; errors pod variants.ID |
| 409 | idempotency_conflict | Ten klucz ma już zapisane inne dane |
| 429 | rate_limited | Limit prób; Retry-After podaje sekundy |
| 500 | server_error | Niepotwierdzony wynik; ponowienie z tym samym kluczem |

Zbyt duże ciało: 413, nieprawidłowy Content-Type: 415. Proxy i awaria sieci mogą
zwrócić inny format lub nie zwrócić odpowiedzi; UI musi mieć ogólny komunikat.

```json
{
  "title": "Nie można zatwierdzić zamówienia demonstracyjnego.",
  "status": 400,
  "code": "validation_failed",
  "errors": { "pickupPoint": ["Podaj fikcyjny kod punktu."] }
}
```

## Idempotencja i zachowanie frontendu

1. Przy poprawnym formularzu utwórz klucz i migawkę żądania. Zablokuj powtórny submit.
2. Ten sam klucz + te same znormalizowane dane zwracają wcześniejsze zamówienie.
   Sprawdzenie i zapis są atomowe w transakcji SQLite, także przy równoległych próbach.
3. Błąd sieci/timeout/500 NIE oznacza braku zapisu. Zachowaj klucz i migawkę;
   ponawiaj identyczne żądanie z tym samym kluczem. Samo AbortController nie cofa zapisu.
4. Nie zmieniaj automatycznie klucza po 409 idempotency_conflict — to błąd przepływu.
   Po niepewnym wyniku nie pozwalaj edytować zamówienia przed rozstrzygnięciem próby.
5. Po jednoznacznym błędzie walidacji nic nie zapisano. Użytkownik może poprawić
   dane; poprawione zamówienie jest nową próbą. Po 429 odczekaj Retry-After.
6. Dopiero poprawne 200/201 + zweryfikowana odpowiedź pozwalają pokazać potwierdzenie
   z API i wyczyścić koszyk. Nie czyść go w finally, po kliknięciu ani po fetch bez kontroli statusu.
7. Ochrona powtórzenia jest ograniczona retencją 24h. Po expiresAt rekord i klucz
   znikają; stare ponowienie może utworzyć nowe demo. Nie ponawiaj bezterminowo.

Klucz nie jest sekretem logowania ani mechanizmem autoryzacji. Nie należy go
publikować; umożliwia ponowne odebranie własnego podsumowania z identycznym żądaniem.
Początkowo pending request może żyć w stanie komponentu. Jeśli chcemy odporność na
F5/utracenie karty, trzeba osobno zaprojektować zapis klucza i migawki oraz jego usuwanie;
obecny localStorage koszyka tego nie zapewnia. Bez takiego zapisu nie obiecujemy
idempotencji po odświeżeniu całej strony.

## Limity i konfiguracja

5 prób POST/minutę na adres IP, stałe okno, bez kolejki. Powtórzenia i błędne
żądania też zużywają limit; GET katalogu nie. Limit jest w pamięci jednej instancji,
resetuje się przy restarcie. To podstawowa ochrona demo, nie pełna ochrona DDoS.
Wspólny adres NAT może oznaczać wspólny limit. Nie logujemy ciała żądania.

Lokalnie baza domyślnie `src/LumaStudio.Api/data/orders.db` przy dotnet run;
ignorowana przez Git. `Orders__DatabasePath` zmienia ścieżkę.
Compose montuje order-data do /var/lib/luma-orders, właściciel UID1654.
Nie usuwać wolumenu przy aktualizacji. Zmiana obrazu nie resetuje idempotencji.

API ufa X-Forwarded-For tylko od skonfigurowanego proxy `Orders__KnownProxy`
(w compose web172.30.22.2). Web ufa tylko istniejącej bramce172.30.20.2 i przekazuje
wyliczony client_ip. Nie włączać zaufania do dowolnych nagłówków/prywatnych sieci.
Przy Cloudflare proxy źródłem może być adres Cloudflare; nie ufamy dowolnemu
CF-Connecting-IP. Osobna konfiguracja zaufanych zakresów wymaga osobnej weryfikacji.

Zmiana podsieci backend na172.30.22.0/24 wymaga sprawdzenia konfliktów i kontrolowanego
odtworzenia **wyłącznie sieci/kontenerów Lumy** przy przyszłym wdrożeniu. Nie ruszać
sieci TSM ani bazy TSM. Brak wdrożenia w tej sesji.

Wzorce: [ASP.NET rate limiting](https://learn.microsoft.com/aspnet/core/performance/rate-limit?view=aspnetcore-10.0),
[zaufane proxy](https://learn.microsoft.com/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0),
[Caddy trusted proxies](https://caddyserver.com/docs/caddyfile/options#trusted-proxies).
