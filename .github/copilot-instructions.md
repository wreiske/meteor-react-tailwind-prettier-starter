# Meteor React Tailwind TypeScript Starter

**ALWAYS follow these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

This is a Meteor 3.4 + React 19 + Tailwind CSS 4 + TypeScript starter application with passwordless authentication and a real-time Todo example.

## Working Effectively

### Initial Setup and Dependencies

- **CRITICAL**: Install Meteor first: `curl https://install.meteor.com/ | sh`
  - If network restrictions prevent direct installation, use package managers or manual installation
  - Alternative: Use `npx meteor` for commands (may require Meteor package installation)
- Install Node.js dependencies: `npm ci --no-audit --no-fund` -- takes 30 seconds
- **NEVER CANCEL**: Wait for complete dependency installation

### Build and Development

- **NEVER CANCEL**: Development server startup: `meteor run` or `npm start` -- NEVER CANCEL, can take 2-5 minutes for initial build. Set timeout to 10+ minutes.
- **NEVER CANCEL**: Production build: `meteor build ../build --directory` -- NEVER CANCEL, takes 5-15 minutes. Set timeout to 30+ minutes.
- Development URL: `http://localhost:3000` (default Meteor port)

### Code Quality and Validation

- Lint check: `npm run lint` -- takes 4 seconds
- Lint fix: `npm run lint:fix` -- takes 3 seconds
- Type checking: `npm run typecheck` -- takes 5 seconds
- Format check: `npm run format` -- takes 2 seconds
- Format fix: `npm run format:fix` -- takes 1 second
- **ALWAYS run these before committing**: Pre-commit hooks will automatically run lint-staged

### Required Validation Steps

- **ALWAYS validate changes by**:
  1. Run `npm run lint` and `npm run typecheck` -- both must pass
  2. Run `npm run format` to ensure code style compliance
  3. Start the application with `meteor run` and test functionality
  4. **MANUAL VALIDATION REQUIRED**: Test the complete auth flow and Todo functionality

## Validation Scenarios

### Authentication Flow Testing

**ALWAYS test the passwordless auth flow after making auth-related changes:**

1. Start application: `meteor run`
2. Navigate to `http://localhost:3000`
3. Enter an email address and submit
4. Check server logs for magic link (if no SMTP configured)
5. Either click the link or copy the token from the URL and paste it manually
6. Verify successful login and Todo app access

### Todo Application Testing

**ALWAYS test Todo functionality after making UI or API changes:**

1. Create a new todo item
2. Toggle todo completion status
3. Delete a todo item
4. Test filtering (all/active/completed)
5. Test clearing completed todos
6. Verify real-time updates (open multiple browser tabs)

### Theme and UI Testing

**ALWAYS test theme switching and responsive design:**

1. Toggle between light and dark themes
2. Test responsive behavior on different screen sizes
3. Verify all UI components render correctly
4. Check accessibility with screen readers if available

## Configuration and Environment

### Environment Variables

- `MAIL_URL`: SMTP configuration for magic link emails (optional for development)
- `ROOT_URL`: Base URL for production deployment
- `PORT`: Server port (default: 3000)
- `MONGO_URL`: MongoDB connection string for production

### Development vs Production

- Development: Magic links logged to console (no SMTP required)
- Production: Requires SMTP configuration via `MAIL_URL`
- Build artifacts: Created in `../build` directory (outside project root)

## Project Structure and Navigation

### Core Directories

- `client/`: React application entry point and global styles
  - `main.tsx`: React root component and Meteor startup
  - `main.html`: HTML shell with root element
  - `styles.css`: Tailwind CSS imports and global styles
- `imports/`: Shared application code
  - `api/todos.ts`: Meteor methods, publications, and data model
  - `startup/`: Client and server startup configuration
  - `ui/`: React components and UI logic
- `server/main.ts`: Meteor server entry point
- Configuration files: `tsconfig.json`, `tailwind.config.cjs`, `eslint.config.mjs`

### Key Files to Modify

- **API Changes**: `imports/api/todos.ts` (methods and publications)
- **UI Components**: `imports/ui/` directory
- **Authentication**: `imports/startup/server.ts` (accounts configuration)
- **Styling**: `client/styles.css` and component files
- **Type Definitions**: Add to `imports/` subdirectories

### Common File Relationships

- When modifying `imports/api/todos.ts`, check `imports/ui/TodosApp.tsx` and `imports/ui/TodoItem.tsx`
- When changing theme variables, check `client/styles.css` and `tailwind.config.cjs`
- When adding UI components, update `imports/ui/index.ts` if creating a shared component library

## Build Pipeline and CI

### GitHub Actions Workflow

The `.github/workflows/ci.yml` validates:

1. Code linting with ESLint
2. Type checking with TypeScript
3. **NEVER CANCEL**: Full Meteor build -- takes 10-20 minutes. Set timeout to 45+ minutes.

### Local Development Workflow

1. Make code changes
2. Run validation: `npm run lint && npm run typecheck && npm run format`
3. Test manually: `meteor run` and validate user scenarios
4. Commit changes (pre-commit hooks will re-run validation)

## Technology Stack Details

### Meteor 3.4 (Node 22)

- Modern ESM module system
- Rspack build toolchain (faster than Webpack)
- Built-in MongoDB integration
- Real-time data synchronization via DDP

### React 19

- Concurrent features enabled
- Suspense for data fetching ready
- Modern hooks and error boundaries

### Tailwind CSS 4

- Oxide (Lightning CSS) engine
- Custom CSS variables for theming
- Utility-first styling approach

### TypeScript 5.x

- Strict mode enabled
- Path aliases configured (`@api/*`, `@ui/*`, etc.)
- Meteor type definitions included

## Troubleshooting

### Common Issues

- **Build fails**: Ensure Meteor is properly installed and Node.js version is 22+
- **Type errors**: Run `npm run typecheck` and fix TypeScript issues
- **Lint errors**: Run `npm run lint:fix` to auto-fix most issues
- **Style issues**: Run `npm run format:fix` to auto-format code
- **Database issues**: Meteor uses embedded MongoDB in development

### Network Restrictions

- If Meteor installation fails due to network restrictions, try alternative installation methods
- Document any installation workarounds in the instructions
- Use `npx meteor` as fallback if global installation unavailable

### Performance Notes

- **NEVER CANCEL**: Initial Meteor startup can take 2-5 minutes
- **NEVER CANCEL**: Meteor builds take 5-15 minutes (normal behavior)
- Hot module reloading works for most React changes
- Database changes may require server restart

## Testing (Currently No Test Framework)

This starter does not include a testing framework. To add testing:

- Consider `meteortesting:mocha` for Meteor-specific testing
- Jest can be added for pure JavaScript/React logic testing
- Playwright or Cypress for end-to-end testing

## Common Commands Reference

```bash
# Setup (one-time)
curl https://install.meteor.com/ | sh
npm ci --no-audit --no-fund

# Development
meteor run                    # Start dev server (2-5 min startup)
npm run lint                  # Check code style (4 sec)
npm run typecheck             # Check TypeScript (5 sec)
npm run format                # Check formatting (2 sec)

# Fixes
npm run lint:fix              # Auto-fix lint issues (3 sec)
npm run format:fix            # Auto-format code (1 sec)

# Production
meteor build ../build --directory  # Build for production (5-15 min)
```

**REMEMBER**: Always validate your changes by running the application and testing user scenarios. Code quality tools catch syntax issues, but manual testing ensures functionality works correctly.
