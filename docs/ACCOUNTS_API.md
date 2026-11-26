# Luma demo accounts — API v1

Accounts are optional. Guest checkout is unchanged. This release starts and
ends sessions but does not associate orders with accounts. My orders, admin,
email verification, password recovery and account deletion are not implemented.
Use fictional details and a password not used anywhere else.

| Method and path | Request | Success |
| --- | --- | --- |
| POST /api/auth/register | JSON `{ "email": "demo@example.test", "password": "only-a-demo-password" }` | 201 + account and session cookie |
| POST /api/auth/login | Same JSON fields | 200 + account and fresh session cookie |
| GET /api/auth/me | No body | 200 + account, or 401 if signed out |
| POST /api/auth/logout | No body; header `X-Luma-Action: logout` | 204; revokes the current session and clears its cookie |

An account response has only `id` and `email` (both strings). Password
confirmation belongs to the UI, not to the request. Registration trims and
lowercases the email; fictional domains must end in .test, .invalid or .example.
Password length is 12–128 characters, not all whitespace; do not trim it.

Errors are Problem Details: check the status and `code`. Registration
`400 validation_failed` may have `errors.email` and/or `errors.password` arrays.
`409 email_taken` means the email is already registered. Login failure is
`401 invalid_credentials` regardless of whether an account exists. Session
lookup uses `401 not_authenticated`. Rate limiting returns
`429 rate_limited` with Retry-After (5 combined register/login attempts per
minute per IP on one instance). A full store returns `503 account_limit`.
Other malformed requests or server failures can use generic Problem Details.

Use same-origin requests. The browser handles the Secure, HttpOnly, SameSite=Strict
cookie; do not read or copy it to localStorage. Auth responses use no-store.
Sessions expire after 8 hours and are revocable; each account can retain up to 5
sessions. Successful authentication rotates the current cookie. Passwords use
ASP.NET Core Identity's password hasher; SQLite stores hashes, not passwords or
raw session tokens.

Enabled in Development; in other environments the routes are disabled unless
`Accounts__Enabled=true`. Local storage defaults to `src/LumaStudio.Api/data/accounts.db`
when launched with the API project. `Accounts__DatabasePath` overrides it.
Before public enablement, configure a persistent writable path and verify HTTPS,
proxy/rate-limit behavior and account retention. Accounts are capped at 500;
this version does not automatically erase account records. Do not enable on VPS yet.

After auth, the frontend can return to the checkout when the user came from
there; only allow known internal destinations. Do not clear the cart on sign-in
or sign-out. Future order ownership must come from the server session, never
from a submitted email or account ID. Do not retroactively claim guest orders.
