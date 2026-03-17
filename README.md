# Unstuck

A React + Express app that helps users turn a messy task into a clear, step-by-step action plan.

## What it does

1. User describes a task on the first screen.
2. App asks if the user already has materials and what the deadline is.
3. The app sends this context to OpenAI and receives a structured task plan.
4. The plan is rendered as a step-by-step visual canvas (React Flow) with time estimates.

## Local setup

Prerequisites:
- Node.js 18+

Install dependencies:
```bash
npm install
```

Create local env file:
```bash
cp .env.example .env.local
```

Set at least:
- `OPENAI_API_KEY`

Optional:
- `OPENAI_MODEL` (default: `gpt-5-mini`)
- `API_PORT` (default: `8787`)

Run frontend + API together:
```bash
npm run dev
```

Open:
- `http://localhost:3000`

## Scripts

- `npm run dev` -> runs Vite + Express API together
- `npm run dev:web` -> Vite frontend only
- `npm run dev:api` -> Express API only
- `npm run lint` -> TypeScript type-check
- `npm run build` -> production frontend build
