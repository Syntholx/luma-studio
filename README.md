# Luma Studio

A responsive jewellery storefront built with React, TypeScript and Tailwind CSS, backed by an ASP.NET Core API. This is a learning project with a working demo checkout, not a real shop.

[Open the live demo](https://luma.szymon-michalek.dev/)

## What to try

- Browse the collection, search by name, and filter or sort the catalogue.
- Select a product variant and quantity. Unavailable variants cannot be purchased.
- Add items to the cart, change quantities and reload the page. The cart is saved in the browser.
- Place a guest demo order in EUR using fictional details, such as `demo@example.test`. Choose a pickup point (e.g. `DEMO01`) or courier delivery. No real payments or fulfilment take place.

The API validates the order and calculates prices and delivery. The checkout clears the cart only after a confirmed success. When a request has an uncertain outcome, retrying in the same checkout view reuses the order data and idempotency key.

## Architecture and current status

- **Frontend:** React, TypeScript, Tailwind CSS and Vite. Includes catalogue loading, error and empty states, image fallbacks and responsive controls.
- **Backend:** .NET 10, ASP.NET Core and SQLite. Demo orders expire after 24 hours. The public demo runs on a VPS behind Caddy with Docker Compose.
- **In development:** registration, sign-in, sign-out and session endpoints are implemented in the backend, but not connected to the storefront or enabled in the public demo. Customer order history and an admin panel are planned.

## Run locally

Requires the .NET 10 SDK, Node.js 24 and npm. From the repository root:

```sh
dotnet run --project src/LumaStudio.Api --launch-profile http
```

In a second terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite. The development server proxies `/api` to `http://localhost:5180`. SQLite databases are created locally; no separate database server is required.

## Checks and documentation

```sh
dotnet test tests/LumaStudio.Api.Tests
cd frontend
npm test
npm run typecheck:tests
npm run build
```

Frontend tests use Vitest and Testing Library. API tests cover catalogue responses, order validation and idempotency, and account sessions with isolated test databases.

- [Catalogue API](docs/API.md)
- [Order API contract](docs/ORDERS_API.md)
- [Account API contract](docs/ACCOUNTS_API.md)
- [Deployment notes](deploy/README.md)

## My contribution

I built and iterated on the React storefront, cart and checkout as part of a guided frontend course, with AI-assisted feedback and examples. I implemented frontend changes and tests; the API, deployment setup, product images and some tests and UI changes were prepared with AI assistance.
