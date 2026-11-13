# Online Job Portal

A public React and Express codebase for a hiring/freelance marketplace. The client and server source trees cover account, project, contract, messaging, referral, and related workflows.

> **Data handling:** this public repository currently tracks populated files under `server/data/`. In particular, `users.db` contains contact fields and password hashes, and `messages.db` contains message records. Treat the files as sensitive until their synthetic status is verified. Do not use them for real user data.

## Architecture and layout

- `client/src/` — React pages, components, and API client.
- `server/` — Express routes, controllers, middleware, Mongoose models, and tracked local data files. The active `server/models/db.js` connects to MongoDB using `MONGO_URI`; the JSON `.db` files are separate tracked data snapshots, not the active Mongoose persistence adapter.
- `server/.env.example` — names of server configuration variables.
- `update_*` — retained alternate working copies whose purpose is not documented.

## Run locally

Install and start the server in one terminal:

```bash
cd server
npm install
npm run dev
```

Then start the client separately:

```bash
cd client
npm install
npm run dev
```

The server package also declares `start`; the client package declares `build`, `lint`, and `preview`.

## Configuration and API

Copy `server/.env.example` to `server/.env`, then supply local service values. Keep secrets outside the repository. The API is organized under `server/routes/` with handlers in `server/controllers/`; no OpenAPI specification was found.

## Deployment and next steps

No root deployment configuration is documented. Confirm all tracked records are synthetic, then replace them with a safe seed process and document the persistence model. Review repository history before removing sensitive files. No repository-level `LICENSE` file was found, so reuse terms for project code are unspecified.
