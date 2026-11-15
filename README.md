# Luma Studio

Demonstracyjna strona marki biżuterii i sklep zbudowany podczas nauki React,
TypeScript i Tailwind CSS. Nie prowadzi prawdziwej sprzedaży ani płatności.

Demo: https://luma.szymon-michalek.dev

## Funkcje

- Katalog z API ASP.NET Core, szczegóły i warianty produktów.
- Wyszukiwanie, kategoria, dostępność, sortowanie i reset widoku.
- Ilość 1–10 na pojedyncze dodanie, scalanie wariantów i koszyk w localStorage.
- Zmiana ilości, usuwanie pozycji i czyszczenie całego koszyka.
- Demonstracyjny checkout: walidacja, dostawa, próg darmowej dostawy i potwierdzenie.
- Loading/error/retry, anulowanie starych pobrań i osobny stan pustego katalogu.
- Oznaczenia niedostępności i blokada zakupu niedostępnych wariantów.
- Obrazy WebP, wspólny fallback i tekst po awarii również fallbacku.
- Responsywne widoki i miniatury koszyka/podsumowania, obsługa klawiaturą.

## Uruchomienie lokalne

Wymagane Node.js24, npm i SDK.NET10. Z głównego katalogu:

```powershell
dotnet run --project src/LumaStudio.Api --launch-profile http
```

W drugim terminalu:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

API: http://localhost:5180/api/products. Otwórz adres Vite pokazany w terminalu.
Proxy Vite przekazuje /api do API; nie działa automatycznie w preview.

## Kontrole

Z frontend/:

```powershell
npm.cmd test
npm.cmd run typecheck:tests
npm.cmd run build
```

Z głównego folderu:

```powershell
dotnet test tests/LumaStudio.Api.Tests
```

Vitest i Testing Library obejmują m.in. koszyk, checkout, klienta API, stany
pobierania, dostępność i warianty. API testowane przez hosta w pamięci.
Fallback zdjęć sprawdzony ręcznie; osobny test automatyczny jeszcze odłożony.

## Wdrożenie i ograniczenia

Wdrożenie15.11.2026: osobny projekt Docker Compose na VPS. Istniejący Caddy
kończy HTTPS; web Lumy obsługuje SPA i proxy API. Luma nie publikuje portów hosta.
API ma unikalny alias luma-catalog-api, bez kolizji z nazwą api w sieci TSM.
Konfiguracja i rollback: [deploy/README.md](deploy/README.md).
Kontrakt katalogu: [docs/API.md](docs/API.md).

Zamówienie to lokalna symulacja: brak POST zamówienia, kont, paneli, bazy zamówień
i prawdziwych płatności. Używaj wyłącznie fikcyjnych danych. Koszyk zostaje w danej
przeglądarce; potwierdzenie zamówienia nie jest trwałe.
Zdjęcia fikcyjnych produktów wygenerowano przez AI. Oryginały PNG są poza public
w assets/source-images/products; aplikacja używa WebP960px (łącznie około86kB).

Frontend pisze autor z wymaganiami, wskazówkami i review mentora AI.
Backend, infrastruktura, grafiki i dokumentacja przygotowane z pomocą AI.
Projekt nie jest przedstawiany jako wykonany w całości bez pomocy.
