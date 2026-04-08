# Settlr

A modern expense-splitting app built for groups. Split bills, track who owes what, and settle up — all in real time.

## Features

- **Group expense splitting** — Create groups, add expenses, and split them equally or by custom amounts
- **Real-time balances** — See who owes what across all your groups instantly
- **Debt simplification** — Minimizes the number of payments needed to settle a group
- **Personal expense tracker** — Log and categorize your own spending separately from group bills
- **Invite system** — Share an invite link to add people to a group
- **Dashboard analytics** — Overview of total balance, what you owe, and what you're owed
- **Settle up flows** — Record payments between members to mark debts as settled
- **Spending trend charts** — Monthly group spending visualized over time
- **Auth** — Email/password sign-up and login via Supabase Auth

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix primitives) |
| Animations | Motion (Framer Motion v12) |
| Backend / DB | Supabase (Postgres + Auth + RLS) |
| Data fetching | TanStack Query v5 |
| Routing | React Router v7 |
| Charts | Recharts |
| Notifications | Sonner |
| Forms | React Hook Form + Zod |

## Local Development

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd settlr
npm install
```

### 2. Set up environment variables

Create a `.env.local` file at the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in your Supabase dashboard under **Project Settings → API**.

### 3. Set up the database

Run the SQL migrations in your Supabase SQL editor (in order):

- `profiles` — user display names and avatars
- `groups` — expense groups with invite codes
- `group_members` — membership join table
- `expenses` — group expenses
- `expense_splits` — per-member split amounts
- `categories` — personal expense categories
- `personal_expenses` — personal spending records

Enable Row Level Security (RLS) on all tables and add policies so users can only read/write their own data.

### 4. Start the dev server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public API key |

These are safe to expose in the browser — Supabase RLS policies enforce data access at the database level.
