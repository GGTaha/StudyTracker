# StudyTracker - Architecture & Technical Documentation

> **Last Updated:** February 2026  
> **Purpose:** Comprehensive guide for AI assistants and developers working on this project

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Application Structure](#application-structure)
5. [State Management (Zustand Stores)](#state-management-zustand-stores)
6. [Pages & Features](#pages--features)
7. [Components](#components)
8. [Key Patterns & Conventions](#key-patterns--conventions)
9. [Important Implementation Details](#important-implementation-details)

---

## Project Overview

StudyTracker is a study management application designed for A-Level students (particularly Cambridge International). It provides:

- **Study Timer** - Track study time per subject with start/pause/stop functionality
- **Past Papers Tracker** - Record and analyze past paper attempts with marks
- **Friends System** - Add friends, compare progress, view leaderboards
- **Dashboard** - View statistics, streaks, and study analytics

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **TailwindCSS 4** | Styling |
| **Zustand** | State management |
| **Supabase** | Backend (Auth + PostgreSQL database) |
| **React Router** | Client-side routing |
| **Lucide React** | Icons |
| **React Hot Toast** | Notifications |

### Key Dependencies
```json
{
  "react": "^19.2.0",
  "zustand": "^5.0.5",
  "@supabase/supabase-js": "^2.50.1",
  "tailwindcss": "^4.1.8",
  "react-router-dom": "^7.6.1"
}
```

---

## Database Schema

### Core Tables

#### `profiles`
Extends Supabase `auth.users`. Created automatically on signup.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | References `auth.users(id)` |
| `username` | TEXT (UNIQUE) | Lowercase username |
| `display_name` | TEXT | Display name |
| `avatar_url` | TEXT | Profile picture URL |
| `user_code` | TEXT (UNIQUE) | Friend code like `#STU-4829` |
| `privacy_activity` | BOOLEAN | Show activity to friends |
| `privacy_weekly_time` | BOOLEAN | Show weekly time to friends |
| `privacy_papers` | BOOLEAN | Show papers to friends |
| `privacy_leaderboard` | BOOLEAN | Appear on leaderboards |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

#### `subjects`
Study subjects (e.g., Mathematics, Physics).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | Owner |
| `name` | TEXT | Subject name |
| `code` | TEXT | Subject code (e.g., "9709") |
| `color` | TEXT | Hex color (e.g., "#3B82F6") |
| `exam_board` | TEXT | Optional exam board |
| `created_at` | TIMESTAMPTZ | |

#### `study_sessions`
Individual study sessions tracked by the timer.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | |
| `subject_id` | UUID (FK) | Can be NULL |
| `tag_id` | UUID (FK) | Session tag (Past Papers, Practice, General) |
| `started_at` | TIMESTAMPTZ | When session started |
| `ended_at` | TIMESTAMPTZ | NULL if session is active |
| `duration_seconds` | INTEGER | Calculated on end |
| `created_at` | TIMESTAMPTZ | |

**Important:** An active timer session has `ended_at = NULL`. The app checks for this on initialization to restore timer state.

#### `session_tags`
Tags for categorizing study sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | NULL for default tags |
| `name` | TEXT | Tag name |
| `color` | TEXT | Hex color |
| `is_default` | BOOLEAN | System default tag |
| `created_at` | TIMESTAMPTZ | |

**Default Tags (user_id = NULL):**
- Past Papers (#EF4444)
- Practice (#F59E0B)
- General (#6B7280)

#### `subject_paper_configs`
Configuration for which papers a subject has.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | |
| `subject_id` | UUID (FK) | |
| `subject_name` | TEXT | Cached subject name |
| `papers` | JSONB | Array of `{paper: "1", max_marks: 75}` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Papers JSONB Format:**
```json
[
  {"paper": "1", "max_marks": 75},
  {"paper": "2", "max_marks": 50},
  {"paper": "3", "max_marks": 75},
  {"paper": "4", "max_marks": 50}
]
```

#### `paper_entries`
Individual past paper attempts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | |
| `subject_id` | UUID (FK) | |
| `year` | INTEGER | Paper year (2000-2100) |
| `session` | TEXT | `'May/Jun'`, `'Feb/Mar'`, or `'Oct/Nov'` |
| `paper_code` | TEXT | **See Paper Code Format below** |
| `marks` | INTEGER | Marks obtained (can be NULL) |
| `max_marks` | INTEGER | Maximum marks for this paper |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

**Paper Code Format:**
- Format: `{paper_number}{variant}` (2 characters)
- Examples:
  - `"11"` = Paper 1, Variant 1
  - `"12"` = Paper 1, Variant 2
  - `"31"` = Paper 3, Variant 1
  - `"42"` = Paper 4, Variant 2
- First digit = Paper number (1-6)
- Second digit = Variant (1-3)

#### `friendships`
Friend relationships between users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | |
| `user_id` | UUID (FK) | Request sender |
| `friend_id` | UUID (FK) | Request recipient |
| `status` | TEXT | `'pending'`, `'accepted'`, `'rejected'` |
| `created_at` | TIMESTAMPTZ | |

**Friendship Logic:**
- Bidirectional check: Friend can be in either `user_id` or `friend_id`
- Only `user_id` can initially create the request
- Either party can update status or delete

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:

1. **Own data:** Users can CRUD their own records
2. **Friend data:** Users can SELECT friend data if:
   - Friendship status = 'accepted'
   - Friend's privacy settings allow it
3. **Profile search:** All profiles are searchable (for friend adding)

---

## Application Structure

```
src/
├── App.tsx                 # Main app with routing
├── main.tsx               # Entry point
├── index.css              # Tailwind imports
├── lib/
│   └── supabase.ts        # Supabase client
├── types/
│   └── database.ts        # TypeScript types
├── stores/                # Zustand state stores
│   ├── authStore.ts       # Authentication
│   ├── timerStore.ts      # Timer & subjects
│   ├── papersStoreNew.ts  # Papers system
│   └── friendsStore.ts    # Friends system
├── pages/
│   ├── auth/              # Login/Signup
│   ├── dashboard/         # Dashboard
│   ├── timer/             # Timer page
│   ├── archive/           # Session history
│   ├── papers/            # Past papers
│   ├── friends/           # Friends system
│   └── settings/          # User settings
└── components/
    ├── ui/                # Reusable UI components
    ├── layout/            # MainLayout, Sidebar
    ├── timer/             # Timer components
    ├── papers/            # Papers components
    └── friends/           # Friends components
```

---

## State Management (Zustand Stores)

### `authStore.ts`
Handles authentication and user profile.

**State:**
- `user` - Supabase User object
- `session` - Supabase Session
- `profile` - User's profile data

**Key Actions:**
- `initialize()` - Set up auth listener
- `signUp(email, password, username)` - Register
- `signIn(email, password)` - Login
- `signOut()` - Logout
- `updateProfile(updates)` - Update profile

### `timerStore.ts`
Manages study timer, subjects, and sessions.

**State:**
- `isRunning`, `isPaused`, `elapsedSeconds` - Timer state
- `activeSession` - Current session (if any)
- `subjects` - User's subjects
- `tags` - Session tags
- `sessions` - Past sessions

**Key Actions:**
- `initialize()` - Fetch data, restore active session
- `startTimer()` - Create session in DB with `ended_at = NULL`
- `stopTimer()` - Update session with `ended_at` and `duration_seconds`
- `tick()` - Called every second to update UI
- `syncTimer()` - Recalculate elapsed time from `started_at`

**Important:** On page load, checks for session with `ended_at = NULL` to restore timer.

### `papersStoreNew.ts`
Manages past papers tracking.

**Types:**
```typescript
type SessionType = 'May/Jun' | 'Feb/Mar' | 'Oct/Nov'

interface PaperEntry {
  year: number
  session: SessionType
  paper_code: string  // "12" = Paper 1 Variant 2
  marks: number | null
  max_marks: number
}

interface SubjectPaperConfig {
  subject_id: string
  subject_name: string
  papers: { paper: string, max_marks: number }[]
}
```

**Key Functions:**
- `getTableRows(configId)` - Groups entries by year/session/variant for table display
- `getSubjectStats(configId)` - Calculate averages and totals

**Variant Logic:**
- Paper code `"12"` means Paper 1, Variant 2
- First character = paper number
- Second character = variant number
- Rows are grouped by `year + session + variant`

### `friendsStore.ts`
Manages friends, activity, leaderboards.

**State:**
- `friends` - Accepted friends with their profiles
- `pendingRequests` - Incoming/outgoing requests
- `activities` - Friend study activity (last 7 days)
- `weeklyLeaderboard`, `allTimeLeaderboard` - Rankings
- `studyingStatus` - Which friends are currently studying

**Key Actions:**
- `searchUsers(query)` - Search by username or user_code
- `sendFriendRequest(userId)` - Send friend request
- `acceptFriendRequest(requestId)` - Accept request
- `getFriendPaperConfigs(friendId)` - Get friend's paper subjects
- `getFriendPaperEntries(friendId, subjectId)` - Get friend's paper entries
- `fetchStudyingStatus()` - Check for friends with active sessions

---

## Pages & Features

### 1. Auth Page (`/auth`)
- Login and signup forms
- Username must be unique
- Creates profile with auto-generated `user_code`

### 2. Dashboard (`/dashboard`)
- Today's study time
- Weekly chart (last 7 days)
- Subject breakdown (pie chart style)
- Quick stats

### 3. Timer Page (`/timer`)
- Large timer display
- Subject selector
- Tag selector (Past Papers, Practice, General)
- Start/Pause/Stop controls
- Persists across page refreshes

### 4. Archive Page (`/archive`)
- List of all past study sessions
- Filter by subject, date range
- Delete sessions
- Shows duration, subject, tag

### 5. Papers Page (`/papers`)
**New papers system with the following structure:**

#### Subject Configuration
- Each subject can have 1-6 papers
- Each paper has its own `max_marks`
- Stored in `subject_paper_configs.papers` as JSONB

#### Entries Table
- Rows grouped by: `Year + Session + Variant`
- Each row shows: Session label (e.g., "Summer 2026 V1"), marks for each paper, total, percentage
- Session types: Summer (May/Jun), Spring (Feb/Mar), Winter (Oct/Nov)

#### Paper Code Format
- `paper_code` = `{paper}{variant}`
- Example: `"32"` = Paper 3, Variant 2
- This allows multiple variants of the same session to be tracked separately

#### Compare Feature
- Compare with individual friend
- "Compare All" - Compare with all friends at once
- Shows side-by-side marks with color coding (green = higher, red = lower)

### 6. Friends Page (`/friends`)
Three tabs:

#### Friends Tab
- List of accepted friends
- Shows "Currently Studying" indicator if friend has active session
- View friend's papers button
- Add friend button
- Incoming/outgoing friend requests

#### Activity Tab
- Friend study sessions from last 7 days
- Shows subject, duration, time ago
- Refresh button

#### Leaderboard Tab
- Weekly or All-time toggle
- Ranked by total study time
- Shows your position highlighted

### 7. Settings Page (`/settings`)
- Profile settings (display name, username)
- Privacy toggles:
  - Show activity to friends
  - Show weekly time to friends
  - Show papers to friends
  - Appear on leaderboards
- Theme toggle (light/dark)

---

## Components

### Layout Components
- `MainLayout` - Sidebar + content area
- `Sidebar` - Navigation with active state

### UI Components
- `LoadingScreen` - Full page loader
- `Modal` - Base modal component

### Timer Components
- Timer display
- Subject/tag selectors
- Control buttons

### Papers Components
- `PapersTable` - Main table with entries
- `AddEntryModal` - Add new paper entry
- `AddSubjectModal` - Add new subject config
- `EditConfigModal` - Edit paper config (max marks)
- `CompareFriendsModal` - Friend comparison view

### Friends Components
- `AddFriendModal` - Search and add friends
- `FriendPapersModal` - View friend's papers

---

## Key Patterns & Conventions

### 1. Store Initialization
All stores follow this pattern:
```typescript
initialize: async () => {
  if (get().isInitialized || get().isLoading) return
  set({ isLoading: true })
  // ... fetch data
  set({ isLoading: false, isInitialized: true })
}
```

### 2. Supabase Queries
- Always check for `auth.uid()` in RLS policies
- Use `maybeSingle()` instead of `single()` when row might not exist
- Handle errors gracefully with console.log

### 3. Session Labels
```typescript
'May/Jun' → 'Summer {year}'
'Feb/Mar' → 'Spring {year}'
'Oct/Nov' → 'Winter {year}'
```

### 4. Color Scheme
- Primary: Blue (#3B82F6)
- Success: Green (#22C55E)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Purple: Used for friends features (#8B5CF6)

### 5. Dark Mode
- Uses TailwindCSS dark mode classes
- Toggle stored in localStorage
- Applied via `dark:` prefix

---

## Important Implementation Details

### Timer Persistence
1. Starting timer creates DB row with `ended_at = NULL`
2. On page load, check for session with `ended_at = NULL`
3. If found, calculate elapsed from `started_at` and restore timer
4. `syncTimer()` recalculates elapsed when tab regains focus

### Paper Variant Handling
```typescript
// Extract variant from paper_code
const getVariant = (paperCode: string): number => {
  if (paperCode.length >= 2) {
    return parseInt(paperCode[1]) || 1
  }
  return 1
}

// Group key includes variant
const key = `${entry.year}-${entry.session}-V${variant}`
```

### Friend Privacy
Before showing friend data, always check:
```typescript
friend.privacy_activity  // For activity
friend.privacy_papers    // For papers
friend.privacy_leaderboard // For leaderboard
```

### Currently Studying Detection
Query for active sessions:
```typescript
const { data } = await supabase
  .from('study_sessions')
  .select('user_id, subject_id, started_at, subjects(name, color)')
  .in('user_id', friendIds)
  .is('ended_at', null)
```

### JSONB Paper Configs
Papers array is stored as JSONB. When reading:
```typescript
const papers = typeof config.papers === 'string' 
  ? JSON.parse(config.papers) 
  : config.papers
```

---

## SQL Migrations

Located in `supabase/migrations/`. Run in order:

1. `schema.sql` - Base tables
2. `phase2_migration.sql` - Session tags
3. `003_paper_entries.sql` - New papers system
4. `004_friends_privacy.sql` - Privacy columns and policies

---

## Environment Variables

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Common Tasks for AI Assistants

### Adding a New Feature
1. Check if DB schema changes needed → Create migration
2. Update relevant Zustand store
3. Create/modify page component
4. Add any needed UI components
5. Test RLS policies

### Debugging Data Issues
1. Check Supabase dashboard for actual data
2. Verify RLS policies aren't blocking
3. Check store's `isInitialized` state
4. Look for console errors from Supabase queries

### Modifying Papers Table
- Remember variant grouping (`year + session + variant`)
- Paper code is `{paper}{variant}` format
- Update both PapersTable and any comparison modals

### Friend Features
- Always respect privacy settings
- Check friendship status = 'accepted'
- Handle bidirectional friendship queries

---

*This document should be updated when major features are added or architectural changes are made.*
