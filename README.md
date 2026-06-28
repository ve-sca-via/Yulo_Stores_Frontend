# Yulo Stores Client

React + Vite client for:

- restaurant owner portal at `/owner`
- QR menu and ordering flow at `/menu`

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run format
```

## Development

The Vite dev server proxies these backend routes to `http://localhost:3000`:

- `/api`
- `/restaurant_owner`
- `/health`

Open:

- `http://localhost:5173/owner`
- `http://localhost:5173/menu?restaurantId=<id>&tableNumber=<table>`

## Production build

Build the client before serving it through the Fastify server:

```bash
npm run build
```

The server serves the built client from:

- `/owner`
- `/menu`
- `/assets/*`
