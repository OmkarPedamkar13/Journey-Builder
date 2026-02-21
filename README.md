# Journey Builder (MERN) - Fresh Setup

This is a fresh full-stack setup with:

- `frontend`: React + Vite + Redux Toolkit + RTK Query + Ant Design
- `backend`: Express + MongoDB + Mongoose

## Folder Structure

- `frontend/` UI app for journey configuration
- `backend/` API app for journeys and templates

## Quick Start

1. Install all dependencies:

```bash
npm install
```

2. Setup backend env:

```bash
cp backend/.env.example backend/.env
```

3. Start backend:

```bash
npm run dev:backend
```

4. Start frontend:

```bash
npm run dev:frontend
```

Frontend runs on `http://localhost:5173` and proxies `/api` to backend `http://localhost:5002`.

5. Ensure Redis is running (required for BullMQ delayed execution):

```bash
redis-server
```

6. Configure email (Nodemailer) in `backend/.env`:

```bash
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_gmail@gmail.com
EMAIL_DEFAULT_SUBJECT=Journey Update
```

## Dynamic Execution

- Trigger is schema-based and event-based (`triggerSchema`, `triggerEvent`).
- Journey execution is queued in BullMQ and processed node-by-node.
- `wait.timer` nodes are delayed jobs in Redis.
- Journey graph is persisted as `graph.nodes`, `graph.edges`, `graph.settings`.

## API Endpoints

- `GET /api/journey-builder/journeys`
- `POST /api/journey-builder/journeys`
- `PATCH /api/journey-builder/journeys/:id/publish`
- `GET /api/journey-builder/templates`
- `POST /api/journey-builder/templates`
- `GET /api/journey-builder/schemas`
- `GET /api/journey-builder/schemas/:schemaKey/fields`
- `POST /api/journey-builder/executions/trigger`
- `POST /api/journey-builder/executions/trigger/lead-created`
- `POST /api/journey-builder/executions/trigger/lead-updated`
- `GET /api/journey-builder/executions`
- `GET /api/journey-builder/executions/:id`
