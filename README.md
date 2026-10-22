# Luma Studio

Demonstracyjna strona marki biżuterii i przyszły sklep internetowy.
Projekt służy nauce React, TypeScript i Tailwind CSS. Nie prowadzi rzeczywistej sprzedaży.

## Aktualny zakres

- Strona główna: nagłówek, hero, opis marki, wybrana kolekcja i stopka.
- Responsywny układ kart: jedna kolumna na telefonie, dwie od breakpointu md.
- Trzy produkty przykładowe w typowanej tablicy `Product[]`.
- Komponent `ProductCard` otrzymuje produkt przez props; lista powstaje przez map.
- Ceny pozostają liczbami i są wyświetlane przez Intl.NumberFormat w PLN.

Nie ma jeszcze API, koszyka, zamówień ani rzeczywistych płatności.
BrowserRouter jest podłączony, ale podstrony sklepu nie zostały jeszcze utworzone.

## Uruchomienie

W folderze `frontend`, z zainstalowanymi Node.js i npm:

```sh
npm ci
npm run dev
```

Otwórz adres Local pokazany przez Vite. Kontrole projektu:

```sh
npm run build
npm run lint
```

Build wykonuje kontrolę TypeScript i tworzy `frontend/dist`.
Nie skonfigurowano jeszcze automatycznych testów zachowania komponentów.
Lint zgłasza ostrzeżenie o komponencie App w pliku startowym; nie blokuje buildu.

## Pliki i punkt powrotu

Kod frontendu znajduje się w `frontend/`. `main.tsx` montuje React w elemencie
app z index.html i zawiera obecną stronę. Dane i typ są w `products.ts`,
a karta w `components/ProductCard.tsx`. Tailwind jest podłączony przez plugin Vite
i import w `styles.css`.

Następny krok: wydzielić kontener Grid i map do komponentu `ProductList`,
który przyjmie tablicę produktów przez props. Zachować wygląd i trzy karty.
Nie implementować tego zadania podczas zapisu przerwy.

## Dalszy kierunek

Docelowo strona marki, katalog, szczegóły i warianty produktów, koszyk oraz
demonstracyjne zamówienie przez własne Web API. Bez kont klientów i prawdziwych
płatności w pierwszej wersji. API będzie przygotowane osobno na potrzeby nauki frontendu.

Frontend pisze autor na podstawie wymagań i tekstów mentora AI, ze wskazówkami
i review. Dokumentację przygotowano z pomocą AI. Projekt nie jest przedstawiany
jako wykonany w całości bez pomocy.
