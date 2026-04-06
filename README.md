# Task Manager API + Frontend

This repo contains a Node/Express/Mongoose backend (Task Manager API) and a minimal React + Vite + TypeScript frontend client.

This README explains how to run the backend and frontend on Windows for local development, required environment variables, and troubleshooting steps I used while setting this up.

---

## Quick start (Windows)

Prerequisites:
- Node.js (v16+ recommended)
- npm
- Git
- Recommended: Docker (optional, used to run MongoDB quickly)

1) Clone and install backend dependencies
```powershell
cd C:\Users\gaura\OneDrive\Desktop\task-manager-api
npm install
```

2) Start MongoDB (pick one)

- Docker (fastest):
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:6.0
```

- Windows installer: download and install MongoDB Community Server from https://www.mongodb.com/try/download/community and choose "Install as a Service". Then start the service in an elevated PowerShell:
```powershell
net start MongoDB
```

3) Create development env file

A `config/dev.env` file was added in this repo. Edit it with real values (example values are present). Required variables:
```
MONGODB_URL=mongodb://127.0.0.1:27017/tasks-api
PORT=3000
JWT_SECRET=replace_with_a_strong_secret
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY  # optional for local dev
FROM_EMAIL=you@example.com
CORS_ORIGIN=http://localhost:5173    # optional, defaults to '*'
```

4) Run the backend (dev)
```powershell
# from repo root
npm run dev
# This runs nodemon with env-cmd using config/dev.env
```
The backend will start on `http://localhost:3000` by default. You'll see `Server is up on port 3000` when it's running.

5) Install and run the frontend
```powershell
cd frontend
npm install
npm run dev
```
The frontend dev server runs at `http://localhost:5173` by default. It reads the API base URL from `frontend/.env` (`VITE_API_URL`).

---

## What I added / changed (developer notes)
- Frontend scaffold: `frontend/` (React + Vite + TypeScript + Tailwind + React Query + Axios)
- Simple CORS middleware in `src/index.js` to allow the frontend dev server to call the API during development.
- Better SendGrid handling: `src/emails/account.js` no-ops and logs when the SendGrid key is missing or invalid (so app doesn't crash during signup/deletion in dev).
- JWT signing in `src/models/user.js` now uses `process.env.JWT_SECRET` with a fallback literal for backward compatibility.
- Port fallback and nicer DB connection logging in `src/index.js` / `src/db/mongoose.js`.
- Dashboard add-task UI and Profile edit/save UI in the frontend. Frontend uses `localStorage` key `taskmanager_token` to store the auth token.
- Axios client (`frontend/src/api/axios.ts`) automatically attaches the token from `localStorage` and logs debug info to the browser console to help diagnose auth/cors issues.

These changes were implemented to make local development smoother; the code is still minimal and intended for development only.

---

## API overview (useful endpoints)
- POST /users — register (body: `{ name, email, password, age? }`) -> returns `{ user, token }`
- POST /users/login — login (body: `{ email, password }`) -> returns `{ user, token }`
- POST /users/logout (Auth required)
- GET /users/me (Auth required)
- PATCH /users/me (Auth required) — update profile (allowed: name, email, password, age)
- POST /users/me/avatar (Auth required) — multipart form upload field `avatar`
- POST /tasks (Auth required) — create task (body: `{ description, completed? }`)
- GET /tasks (Auth required) — list tasks; supports query: `completed`, `limit`, `skip`, `sortBy`

Auth header: `Authorization: Bearer <token>` — the frontend saves tokens to `localStorage` under key `taskmanager_token`.

---

## Common troubleshooting & tips

- "Network Error" in browser
  - Check browser DevTools -> Console / Network. Confirm the authorization header is present and that the request is not blocked by CORS.
  - Ensure backend is running on `http://localhost:3000` and `config/dev.env` matches.

- Tokens
  - After login/register the frontend stores the token in localStorage: `localStorage.getItem('taskmanager_token')`.
  - If requests are unauthenticated, ensure the Axios client is the same instance used by components and that it attaches the token. The frontend adds console debug logs for this.

- Age shows as 0 in DB
  - The Mongoose `User` schema originally set `age` default to `0`. If you prefer "not set" instead of 0, remove the `default: 0` from the schema and migrate existing users (example below).
  - To unset age for all users where age === 0 (in mongosh):
    ```js
    use tasks-api
    db.users.updateMany({ age: 0 }, { $unset: { age: "" } })
    ```

- MongoDB connection refused
  - Ensure MongoDB service/container is running and listening on port 27017. Test with PowerShell:
    ```powershell
    Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
    ```

- Use Invoke-RestMethod (PowerShell) to avoid quoting issues when testing API
  ```powershell
  Invoke-RestMethod -Uri 'http://localhost:3000/users' -Method POST -ContentType 'application/json' -Body (ConvertTo-Json @{name='Test'; email='a@example.com'; password='MyPass123'})
  ```

---

## Running migrations (optional)
If you change the `age` default behavior you may want to migrate existing documents. Example (run in mongosh or MongoDB Compass):
```js
use tasks-api
// remove age field when it is exactly 0
db.users.updateMany({ age: 0 }, { $unset: { age: "" } })
```

---

## Developer notes & next steps
- You can extend the frontend with edit/delete & toggle completed functionality for tasks (the API supports it already).
- Add validation and friendly error toasts to the frontend.
- Consider using a dedicated CORS package (`cors`) and locking `CORS_ORIGIN` to your frontend origin in production.

---

If you'd like, I can:
- Add a small health endpoint (`GET /health`) that returns DB connectivity status.
- Add avatar upload UI to profile.
- Remove `age` default and run the migration for you.

Tell me which of those you'd like me to implement next.
