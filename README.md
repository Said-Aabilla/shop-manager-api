# Shop practice API

A small local REST API for students practicing `fetch`, HTTP status codes, and DOM updates.

There is no login and no user accounts. A reservation stores the customer's name, email, and address on that reservation only.

Students should use the documentation page, not this file. It explains every route and includes `fetch` examples that run in the browser.

## Run

Node.js 18 or newer.

```powershell
npm install
npm start
```

Open http://localhost:3000 and leave the server running while students work. The terminal prints each API request with its status code.

Another port:

```powershell
$env:PORT=3001; npm start
```

## Data

Dummy categories, products, and reservations are loaded into memory on every start. Nothing is written to disk. `POST /api/reset` loads the same data again without stopping the server.

The seed data lives in `src/seed.js`.

## Routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/categories` | List categories |
| GET | `/api/categories/:id` | One category |
| POST | `/api/categories` | Create a category |
| PUT | `/api/categories/:id` | Replace a category |
| DELETE | `/api/categories/:id` | Delete a category |
| GET | `/api/products` | List products, with optional filters |
| GET | `/api/products/:id` | One product |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/:id` | Replace a product |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/reservations` | List reservations, with optional filters |
| GET | `/api/reservations/:id` | One reservation |
| POST | `/api/reservations` | Reserve a product |
| PATCH | `/api/reservations/:id` | Change status, quantity, or customer details |
| DELETE | `/api/reservations/:id` | Delete a reservation and release its stock |
| POST | `/api/reset` | Restore the dummy data |

Calls from another page are allowed (`Access-Control-Allow-Origin: *`), so students can open their own HTML file and call `http://localhost:3000`.
