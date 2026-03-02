<div align="center">

# Meteor 3.5 + React 19 + Tailwind CSS 4 + TypeScript Starter

Modern, minimal boilerplate for building real‑time Meteor apps with React 19, Tailwind 4, and TypeScript.

Includes **real-time Chat**, **Live Polls**, **Reactive Todos**, and **User Profiles** as ready-to-run examples showcasing Meteor's DDP.

▶️ Live demo: https://todo-sample.meteorapp.com

| Stack       | Version              | Notes                                |
| ----------- | -------------------- | ------------------------------------ |
| Meteor      | 3.5-beta.4 (Node 22) | ESM, modern rspack build toolchain   |
| React       | 19                   | Suspense / concurrent features ready |
| TailwindCSS | 4.x                  | Oxide (Lightning CSS) engine         |
| TypeScript  | 5.x                  | Strict mode                          |

![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4?logo=prettier&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-22.x-339933?logo=node.js&logoColor=white)
![Meteor](https://img.shields.io/badge/Meteor-3.5--beta.3-DE4F4F?logo=meteor&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## Highlights

- **Passwordless auth** — magic link email login (logs to console in dev)
- **4 real-time features** — Todos, Chat, Polls, User Profiles — all using Meteor DDP
- **Shared validation** — [Zod](https://zod.dev) schemas shared between server methods and client forms
- **Typed data hooks** — `useMethod` wrapper eliminates raw `Meteor.call` from components
- **Dark / light theme** — persisted via `localStorage`, flash-free with SSR inline script
- **SSR + hydration** — landing page rendered server-side, hydrated on client
- **Security defaults** — rate limiting, Mongo indexes, scoped publications, input validation
- **Strict tooling** — ESLint, Prettier, simple-import-sort, TypeScript strict mode
- **Testing** — Vitest with schema validation tests; CI runs lint + typecheck + tests + build

## Screenshots

<div align="center">

| Landing (Light)                                                                                       | Landing (Dark)                                                                                      | Login                                                                                        |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| <img src="./public/screenshots/landing-hero-light.png" alt="Landing page — light mode" width="300" /> | <img src="./public/screenshots/landing-hero-dark.png" alt="Landing page — dark mode" width="300" /> | <img src="./public/screenshots/login-light.png" alt="Login page — light mode" width="300" /> |

| Todos                                                                                       | Chat                                                                                            | Polls                                                                                        |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| <img src="./public/screenshots/todos-light.png" alt="Todos app — light mode" width="300" /> | <img src="./public/screenshots/chat-light.png" alt="Real-time chat — light mode" width="300" /> | <img src="./public/screenshots/polls-light.png" alt="Live polls — light mode" width="300" /> |

| Todos (Dark)                                                                              | Chat (Dark)                                                                                   | Polls (Dark)                                                                               |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| <img src="./public/screenshots/todos-dark.png" alt="Todos app — dark mode" width="300" /> | <img src="./public/screenshots/chat-dark.png" alt="Real-time chat — dark mode" width="300" /> | <img src="./public/screenshots/polls-dark.png" alt="Live polls — dark mode" width="300" /> |

> **Regenerate screenshots**: `npm run screenshots` (requires the dev server running on `localhost:3000`)

</div>

## Quick Start

```bash
# Install Meteor (if not already installed)
curl https://install.meteor.com/ | sh

# Clone and run
git clone https://github.com/wreiske/meteor-react-tailwind-prettier-starter
cd meteor-react-tailwind-prettier-starter
npm ci --no-audit --no-fund
meteor run
```

Open http://localhost:3000. Magic link tokens are logged to the server console in development.

## Project Structure

```
client/
  main.tsx                  # React root — createRoot / hydrateRoot
  main.html                 # HTML shell with <div id="root">
  styles.css                # Tailwind imports + minimal global styles
imports/
  features/                 # Feature modules — self-contained API + UI
    todos/
      api.ts                # Collection, methods, publication, rate limiting
      schema.ts             # Zod schemas + TypeScript types (isomorphic)
      schema.test.ts        # Vitest tests for schema validation
      TodosApp.tsx          # Feature UI
      TodoItem.tsx
    chat/                   # Same pattern: api.ts, schema.ts, ChatApp.tsx
    polls/                  # Same pattern: api.ts, schema.ts, PollsApp.tsx
    profile/                # api.ts, schema.ts, ProfilePage.tsx, Avatar.tsx
    inbox/                  # Dev email viewer (auto-disabled in production)
  lib/
    constants.ts            # Shared validation limits, storage keys, app URLs
    useMethod.ts            # Typed Meteor.call wrapper hook
    useTheme.ts             # Shared theme hook (read/apply/toggle)
  startup/
    client.ts               # Client startup (feature API imports)
    server.ts               # Accounts config, dev email capture, user pub
    ssr.tsx                  # SSR for landing page + SEO meta tags
  ui/                       # Shared UI components
    AppLayout.tsx            # Root shell — routing, sidebar, header
    LandingPage.tsx          # Marketing page (SSR-safe, Motion animations)
    LoginForm.tsx            # Passwordless auth form
    Button.tsx, Input.tsx, Card.tsx, Tooltip.tsx  # Primitives
    ThemeToggle.tsx, Sidebar.tsx, AppHeader.tsx   # Layout components
server/
  main.ts                   # Server entry — imports features + startup
```

### How to Add a Feature

1. Create `imports/features/myfeature/`
2. Add `schema.ts` — Zod schemas + TypeScript types
3. Add `api.ts` — collection, methods, publication (import schemas)
4. Add `MyFeatureApp.tsx` — UI component (import `useMethod` + constants)
5. Add route in `imports/ui/AppLayout.tsx` → `ROUTES` map
6. Add nav item in `imports/ui/Sidebar.tsx` → `NAV_SECTIONS`
7. Import `api.ts` in `server/main.ts` and `imports/startup/client.ts`

### Conventions

- **Validation**: Define Zod schemas in `schema.ts`, use them in both server methods and client forms
- **Constants**: Shared limits/keys live in `imports/lib/constants.ts`
- **Methods**: Components use `useMethod('method.name')` — never call `Meteor.call` directly
- **Theme**: Use `useTheme()` from `imports/lib/useTheme.ts` — never access `localStorage` directly for theme
- **Types**: Export TypeScript interfaces from `schema.ts`, re-export from `api.ts`

## Auth Flow

1. User enters email → server sends magic link
2. In development (no `MAIL_URL`), the email is captured in the **Dev Inbox** (`/inbox`)
3. Click the link or paste the token manually
4. User is authenticated — app redirects to `/app/todos`

```bash
# Configure SMTP for production
MAIL_URL="smtp://user:pass@smtp.example.com:587" meteor run
```

## Commands

```bash
# Development
meteor run                    # Start dev server (2-5 min first startup)
npm run lint                  # Check code style
npm run typecheck             # Check TypeScript
npm run format                # Check Prettier formatting
npm test                      # Run Vitest tests
npm run test:watch            # Run tests in watch mode
npm run screenshots           # Capture screenshots with Playwright

# Fixes
npm run lint:fix              # Auto-fix lint issues
npm run format:fix            # Auto-format code

# Production
meteor build ../build --directory   # Build (5-15 min)
```

## Feature API Reference

### Todos

| Method                 | Args            | Description          |
| ---------------------- | --------------- | -------------------- |
| `todos.insert`         | `text: string`  | Create a todo        |
| `todos.toggle`         | `id: string`    | Toggle completion    |
| `todos.remove`         | `id: string`    | Delete one           |
| `todos.clearCompleted` | —               | Delete all completed |
| `todos.reorder`        | `ids: string[]` | Reorder by position  |

### Chat

| Method             | Args                   | Description        |
| ------------------ | ---------------------- | ------------------ |
| `chat.createRoom`  | `name: string`         | Create a chat room |
| `chat.sendMessage` | `roomId, text: string` | Send a message     |

### Polls

| Method         | Args                          | Description   |
| -------------- | ----------------------------- | ------------- |
| `polls.create` | `question, options: string[]` | Create a poll |
| `polls.vote`   | `pollId, optionId: string`    | Cast a vote   |
| `polls.close`  | `pollId: string`              | Close voting  |
| `polls.remove` | `pollId: string`              | Delete a poll |

## Styling & Theming

- **Tailwind CSS 4** with Oxide (Lightning CSS) engine
- Minimal custom CSS in `client/styles.css` (font smoothing + resets)
- Dark mode via `data-theme` attribute + `dark` class
- Theme persisted in `localStorage` using shared `THEME_KEY` constant
- SSR inline script prevents flash of wrong theme

## Production

```bash
meteor build ../build --directory
cd ../build/bundle
npm install --production
PORT=3000 MONGO_URL="mongodb://..." ROOT_URL="https://..." MAIL_URL="smtp://..." node main.js
```

Add a reverse proxy (Nginx / Caddy) for TLS and compression.

## Contributing

PRs welcome. Keep scope tight — this is a _teachable_ baseline, not a kitchen sink.

## License

MIT — see `LICENSE`.
