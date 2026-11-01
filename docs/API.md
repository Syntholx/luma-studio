# Lokalne API katalogu

API asystenta wspierające naukę frontendu: ASP.NET Core10, trzy fikcyjne produkty
w pamięci, bez bazy, kont, edycji i zamówień. Nie jest wdrożeniem produkcyjnym.
Klient frontend/services/products.ts waliduje odpowiedź. App pobiera wspólny
katalog i przekazuje go do szczegółów, koszyka i checkoutu. Ceny i dostępność
helperów koszyka pochodzą z przekazanego katalogu; products.ts pozostaje źródłem
typów i danych przykładowych testów, nie runtime katalogu.

Widoki obsługują ładowanie, błąd i ponowienie. parseCart sprawdza strukturę
lokalnego zapisu bez sprawdzania istnienia ID w statycznych danych. Brak produktu
lub wariantu jest widoczny w koszyku jako pozycja do usunięcia i blokuje checkout.
Potwierdzenie zamówienia nadal jest lokalną symulacją, nie żądaniem POST.

Checkpoint integracji: brak jeszcze anulowania/ochrony przed nieaktualnym
żądaniem w loadCatalog, osobnego komunikatu pustego katalogu (jest komunikat
ProductList), testów stanów pobierania App i testu usuwania brakującej pozycji.
Nie traktować aktualnego klienta jako kompletnej integracji produkcyjnej.
Folder services zastąpił api: moduły /api/*.ts kolidowały z proxy /api.

## Uruchomienie

Z głównego katalogu repo, SDK.NET10:

```powershell
dotnet run --project src/LumaStudio.Api --launch-profile http
```

Adres `http://localhost:5180`, zatrzymanie Ctrl+C. Serwer lokalny, bez publikacji.
CORS nie jest włączony; proxy Vite /api przekazuje do localhost:5180.
Uruchom frontend osobno przez npm.cmd run dev w frontend/. Proxy dotyczy
development, nie gotowego statycznego wdrożenia ani automatycznie preview.

## Kontrakt

- GET /api/products:200 application/json, tablica Sol/Aura/Luna.
- GET /api/products/{slug}:200 z produktem, brak:404 application/problem+json.
- Zapis nieobsługiwany:405. Bez paginacji, filtrowania serwerowego i totalCount.

Produkt: id:number, name:string, category:string, price:number,
description:string, slug:string, variants:tablica.
Wariant: id:number, size:string, price:number, isAvailable:boolean.
JSON camelCase, ceny PLN jako liczby (decimal na serwerze), nie tekst waluty.
ID i dane odpowiadają frontend/products.ts. Slugi porównywane dokładnie.
Price produktu to bazowa cena katalogowa; cena wariantu dotyczy pozycji koszyka.
Przyszłe zamówienie wymaga niezależnej walidacji i wyceny na serwerze.

Aura ma id1, warianty204/S/89.50/dostępny,202/M/94.50/dostępny,
203/L/89.50/niedostępny. Endpoint przykładowy: /api/products/bransoletka-aura.

## Testy

```powershell
dotnet test tests/LumaStudio.Api.Tests
```

Testy hosta w pamięci sprawdzają kontrakt listy,3 szczegóły, warianty Aury,
404 i odrzucenie zapisu. Nie testują integracji frontendu ani publicznego hostingu.
