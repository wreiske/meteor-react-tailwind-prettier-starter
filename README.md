<div align="center">

# Meteor 3.4 + React 19 + Tailwind CSS 4 + TypeScript Starter

Modern, minimal boilerplate for building real‑time Meteor apps with React 19, Tailwind 4, and TypeScript.

▶️ Live demo: https://todo-sample.meteorapp.com

| Stack       | Version       | Notes                                |
| ----------- | ------------- | ------------------------------------ |
| Meteor      | 3.4 (Node 22) | ESM, modern rspack build toolchain   |
| React       | 19            | Suspense / concurrent features ready |
| TailwindCSS | 4.x           | Oxide (Lightning CSS) engine         |
| TypeScript  | 5.x           | Strict mode                          |

Includes passwordless (magic link) auth + a realtime Todo example.

<br />

![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4?logo=prettier&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-22.x-339933?logo=node.js&logoColor=white)
![Meteor](https://img.shields.io/badge/Meteor-3.4.beta.6-DE4F4F?logo=meteor&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## Highlights

Core features kept intentionally lean:

- React 19 + TypeScript hot reload development loop
- Tailwind CSS 4 with a _near-zero_ custom CSS footprint (only minimal globals)
- Accessible dark/light Theme Toggle (persists via localStorage, prevents FOUC)
- Passwordless email login (magic link + optional one-time code entry)
- Realtime Todo list demonstrating Meteor publications + methods + latency compensation
- Reusable UI primitives (`Button`, `Card`, `Input`, `Tooltip`, `ThemeToggle`, etc.)
- Headless, utility-first Tooltip component (pure Tailwind – no extra global CSS)
- Strict linting + formatting (ESLint, Prettier, simple-import-sort)
- Production touches: (example) rate limiting + Mongo index hooks (extend as needed)
- Dark mode class + data attribute for flexible theming

## Screenshots

<div align="center">

| Login                                                                      | Magic Link (Token Entry)                                                                                       | Empty Todos                                                                        |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| <img src="./screenshots/todo-sample.png" alt="Login screen" width="300" /> | <img src="./screenshots/todo-sample (1).png" alt="Passwordless token entry confirmation screen" width="300" /> | <img src="./screenshots/todo-sample (2).png" alt="Empty todos list" width="300" /> |

<br />

Additional views:

<img src="./screenshots/todo-sample (3).png" alt="Todos populated (variant 1)" width="300" />
<img src="./screenshots/todo-sample (4).png" alt="Todos populated (variant 2)" width="300" />

</div>

## Project Structure

```
apps/meteor-react-tailwind-prettier-starter/
  client/
    main.tsx              # React entry
    main.html             # Meteor HTML shell
    styles.css            # Tailwind source + tiny global rules
  imports/
    api/
      todos.ts            # Methods + publication
    lib/                  # (Placeholder for shared helpers)
    schemas/              # (Placeholder for future collection schemas)
    server/
      startup/
        client.ts         # Client startup hooks
        server.ts         # Server startup (accounts, indexes, rate limiting)
    ui/
      LoginForm.tsx
      TodosApp.tsx
      TodoItem.tsx
      Tooltip.tsx
      ThemeToggle.tsx
      Card.tsx
      Button.tsx
      Input.tsx
      SmallMuted.tsx
  server/
    main.ts               # Meteor server entry (imports startup + api)
  scripts/
    prune-legacy.sh       # Example maintenance script
  tailwind.config.cjs
  postcss.config.cjs
  eslint.config.mjs
  tsconfig.json
  package.json
  README.md
```

## Quick Start

Requirements: Git + Meteor (or use `npx meteor`) + Node 22 (bundled by Meteor 3).

```bash
git clone https://github.com/wreiske/meteor-react-tailwind-prettier-starter
cd meteor-react-tailwind-prettier-starter
meteor npm install
meteor run
```

Open http://localhost:3000

## Auth Flow (Passwordless)

1. User enters email and submits.
2. A magic link email is generated (shown in server logs if no SMTP configured).
3. Clicking the link logs the user in; OR the one-time token from the URL can be pasted manually.

Configure SMTP for real delivery (development fallback logs the link):

```powershell
$env:MAIL_URL = "smtp://user:pass@smtp.example.com:587"
meteor run
```

## Todo API Reference

Methods (latency-compensated):

| Method                 | Action                     |
| ---------------------- | -------------------------- |
| `todos.insert(text)`   | Create a todo              |
| `todos.toggle(id)`     | Toggle completion          |
| `todos.remove(id)`     | Remove one                 |
| `todos.clearCompleted` | Remove all completed items |

Publication:

| Publication  | Returns                              |
| ------------ | ------------------------------------ |
| `todos.list` | All todos for the authenticated user |

Collection shape (reference):

```ts
interface TodoDoc {
  _id: string;
  text: string;
  done: boolean;
  userId: string;
  createdAt: Date;
}
```

### Extending

- Add query params (filter: active/done) via a refined publication.
- Add optimistic UI batching or offline queue.
- Add rate limiting (package already available; extend as needed).
- Introduce input validation (e.g. `zod`) for safer method contracts.

## Styling & Theming

Tailwind 4 with Oxide (Lightning CSS). Minimal custom CSS lives in `client/styles.css` (font smoothing + base resets). All components rely on utilities. Dark mode is toggled by a stored preference applying both the `dark` class and a `data-theme` attribute for future design token expansions.

Tooltip component: pure Tailwind utilities (no external lib, no global tooltip stylesheet). Respects reduced-motion preferences.

## Tooling

- Prettier enforced (including Tailwind class sorting if configured)
- ESLint flat config (`eslint.config.mjs`)
- TypeScript strict mode
- Simple directory aliases can be added via `tsconfig.json` if desired

## Production Notes

- Build: `meteor build ./build --directory`
- Provide env vars: `ROOT_URL`, `PORT`, `MONGO_URL`, `MAIL_URL`
- Add a reverse proxy (Nginx/Caddy) for TLS & compression
- Consider adding a tiny theme-preload script to avoid dark/light flash (optional)

### Hardening Ideas

- Add DDPRateLimiter rules for auth + todos
- Create MongoDB indexes (e.g. on `userId, createdAt` for todos)
- Add schema validation layer (collection2, zod, or check)
- Implement content security policy headers

## Customization Roadmap (Pick & Choose)

| Goal            | Direction                                        |
| --------------- | ------------------------------------------------ |
| SSR / streaming | Integrate Meteor SSR + React 19 streaming APIs   |
| Testing         | Add `meteortesting:mocha` or Jest for pure logic |
| Design System   | Replace primitives w/ your component library     |
| Auth Variants   | Add OAuth, passwords, SMS codes                  |
| Performance     | Add code splitting / dynamic imports             |

## Contributing

PRs welcome. Keep scope tight (clarity > features). The aim is a _teachable_ baseline, not an everything kitchen sink starter.

## License

MIT – see `LICENSE`.

## Acknowledgements

Thanks to the Meteor, React, and Tailwind communities for excellent tooling.
