
# StudyTracker

StudyTracker is a React + TypeScript web app for tracking study sessions, managing subjects, logging past paper performance, and comparing progress with friends.

## Features

- Authentication with Supabase
- Dashboard with study insights
- Study timer with session tracking
- Archive of past study sessions
- Past papers tracking and analytics
- Friends system with activity and leaderboard views
- Profile and privacy settings

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Supabase
- React Router
- Recharts

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env` file in the repository root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can copy values from `.env.example`.

### 3) Run the app

```bash
npm run dev
```

Open the app at the local URL shown by Vite (usually `http://localhost:5173`).

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Type-check and build production bundle
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build locally

## Database

Supabase SQL files are located in `supabase/`:

- `schema.sql`
- `phase2_migration.sql`

Apply them in your Supabase project in the required order.

## Project Structure

```text
src/
├── components/   # UI and feature components
├── lib/          # External clients/config (Supabase)
├── pages/        # Route pages
├── stores/       # Zustand stores
├── types/        # Shared TypeScript types
├── App.tsx       # App routing and guards
└── main.tsx      # App entrypoint
```


- `ARCHITECTURE.md` contains detailed architecture and technical notes.
