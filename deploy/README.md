# Wdrożenie demonstracyjne Lumy

Status: wdrożono15.11.2026 i potwierdzono działanie publiczne.
Adres docelowy: https://luma.szymon-michalek.dev. Bez prawdziwych zamówień/płatności.

Odbiór HTTP asystenta: HTTPS/home200, API200/3 produkty, szczegóły200,
WebP200/image-webp, JS200/text-javascript, brakujące obrazy/skrypty/API404,
HTTP308→HTTPS oraz domena TSM200. Autor potwierdził koszyk, odświeżenie,
checkout i telefon. To ręczny odbiór, nie pełny automatyczny audyt dostępności.
Źródła VPS: /opt/luma-demo. Kopia bramki: /opt/tsm-demo/deploy/Caddyfile.before-luma,
stary obraz bramki: tsm-demo-web:before-luma. Nowy obraz bramki zbudowany;
aktywny Caddy przeładowano bez restartowania API/SQL TSM. Nie nadpisywać kopii.

## Architektura

Istniejący Caddy TSM zajmuje80/443 i kończy HTTPS. Blok edge-luma.caddy przekazuje
wyłącznie domenę Lumy do luma-web:8080 przez istniejącą sieć tsm-demo_proxy.
Luma ma osobny projekt compose, kontener web z dist oraz API z katalogiem.
API jest tylko w sieci backend Lumy; żaden kontener Lumy nie publikuje portów.
Proxy używa unikalnego aliasu luma-catalog-api, nie ogólnego api: web widzi też
sieć TSM, w której api wskazuje inny serwis. Ogólne nazwy mogą kolidować.
Nie podłączać API Lumy do sieci SQL TSM. Brak bazy, sekretów i volume danych Lumy.
Lokalny proxy Vite nie jest używany: /api obsługuje produkcyjny Caddy Lumy.
Brakujące /assets i /images zwracają404, nie HTML strony. Trasy SPA dostają index.

## Przygotowanie

- DNS A luma → adres VPS; nie dodawać AAAA bez sprawdzonego IPv6.
- Na pierwsze uruchomienie DNS-only upraszcza sprawdzenie certyfikatu i origin.
- Docker Compose i istniejąca sieć tsm-demo_proxy wymagane.
- Przenieść źródła do osobnego /opt/luma-demo; bez node_modules/dist/.git/bin/obj
  i assets/source-images. Oryginalne PNG nie są potrzebne w obrazie.
- Z katalogu deploy: docker compose config --quiet, następnie docker compose build
  i docker compose up -d. Nie uruchamiać down na projekcie TSM.

## Przed zmianą bramki

Sprawdzić wewnętrznie z kontenera bramki http://luma-web:8080/ oraz /api/products
z Host:luma.szymon-michalek.dev. Potwierdzić JSON, obraz WebP, trasę szczegółów,
404 brakującego obrazu, poprawny Content-Type modułu JS i404 nieznanego endpointu.
Sprawdzić logs Lumy. depends_on nie zastępuje gotowości API.

## Bramka TSM i trwałość

Przed zmianą zapisać kopię /opt/tsm-demo/deploy/Caddyfile i obrazu web TSM
pod osobnym tagiem; porównać plik źródłowy z aktywnym w kontenerze.
Nie nadpisywać sekcji tsm.szymon-michalek.dev ani globalnego email.
Dodać wyłącznie blok edge-luma.caddy. Walidować caddy validate wewnątrz bramki.
Zbudować tylko web TSM, żeby nowy Caddyfile znalazł się również w obrazie
na przyszłe recreate. API/SQL TSM nie przebudowywać ani nie restartować.
Aktywną konfigurację podmienić dopiero po walidacji, następnie caddy reload
--config /etc/caddy/Caddyfile --adapter caddyfile. Nie używać compose up dla TSM,
jeśli wystarczy reload. Konfiguracja w zmienionym kontenerze przetrwa restart,
a zbudowany obraz i źródło zapewnią ją również po odtworzeniu kontenera.
Nie traktować samego docker cp jako trwałego wdrożenia.

Rollback: przywrócić źródłowy Caddyfile z kopii, skopiować do bramki, validate/reload,
przywrócić poprzedni tag obrazu web TSM. Nie usuwać wolumenów certyfikatów ani SQL.

## Odbiór publiczny

Sprawdzić HTTPS i przekierowanieHTTP, katalogJSON, obrazy, wejście/F5 na szczegółach,
koszyk, checkout z fikcyjnymi danymi, błędy API, konsolę oraz regresję domeny TSM.
Publiczny koszyk nadal jest wyłącznie lokalnym zapisem przeglądarki.
Następne wdrożenia: tylko projekt Lumy, docker compose build i up -d --no-deps
dla zmienionej usługi. Nie przejmować ani nie zamykać portów bramki.
