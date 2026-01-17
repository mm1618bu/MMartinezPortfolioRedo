# ESLint + Prettier + Pre-commit Hooks Setup

## Overview

The staffing-flow project is now configured with:

- **ESLint**: Code linting for JavaScript/TypeScript
- **Prettier**: Code formatting for JS/TS/JSON/CSS/MD
- **Husky**: Git hooks management
- **lint-staged**: Pre-commit file staging
- **Black + Ruff**: Python formatting and linting

## What Was Configured

### 1. ESLint Configuration

- Support for JavaScript, JSX, TypeScript, and TSX files
- React hooks and refresh plugin rules
- TypeScript ESLint parser and plugin
- Integration with Prettier (no conflicting rules)
- Browser and Node.js globals

### 2. Prettier Configuration

- 100 character line width (matches Black)
- Single quotes for JavaScript
- Semicolons enabled
- 2 space indentation
- Trailing commas (ES5)
- LF line endings

### 3. Git Hooks (Husky)

#### pre-commit

Runs `lint-staged` which:

- Formats and lints JS/TS files with ESLint + Prettier
- Formats JSON, CSS, and MD files with Prettier
- Formats and lints Python files with Black + Ruff

#### pre-push

Runs TypeScript type checking to prevent pushing code with type errors

#### post-checkout

Auto-installs dependencies when switching branches if needed

### 4. VS Code Integration

- Format on save enabled
- ESLint auto-fix on save
- Auto-organize imports on save
- Prettier as default formatter for JS/TS/JSON
- Black as default formatter for Python
- Recommended extensions listed

## Usage

### Automatic (Recommended)

Files are automatically formatted and linted when you:

1. Save files in VS Code (if you have the extensions installed)
2. Commit changes (pre-commit hook)
3. Push changes (pre-push hook runs type check)

### Manual Commands

#### Formatting

```bash
npm run format              # Format all JS/TS/JSON/CSS/MD
npm run format:check        # Check formatting without changes
npm run format:python       # Format Python files
```

#### Linting

```bash
npm run lint                # Lint all (JS/TS + Python)
npm run lint:js             # Lint JS/TS only
npm run lint:fix            # Auto-fix JS/TS issues
npm run lint:python         # Lint Python only
```

#### Type Checking

```bash
npm run type-check          # Check all TypeScript
npm run type-check:web      # Check frontend only
npm run type-check:api      # Check Node API only
```

## Files Created/Modified

### Created

- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to ignore for formatting
- `.husky/pre-commit` - Pre-commit hook script
- `.husky/pre-push` - Pre-push hook script
- `.husky/post-checkout` - Post-checkout hook script
- `.vscode/extensions.json` - Recommended VS Code extensions

### Modified

- `eslint.config.js` - Added Prettier integration and TypeScript support
- `package.json` - Added formatting/linting scripts and lint-staged config
- `.vscode/settings.json` - Added Prettier and ESLint settings
- `.gitignore` - Added Python cache directories
- `README.md` - Updated documentation

## Recommended VS Code Extensions

The project recommends installing:

1. **Prettier - Code formatter** (esbenp.prettier-vscode)
2. **ESLint** (dbaeumer.vscode-eslint)
3. **Python** (ms-python.python)
4. **Pylance** (ms-python.vscode-pylance)
5. **Black Formatter** (ms-python.black-formatter)
6. **Ruff** (charliermarsh.ruff)

VS Code will prompt you to install these when you open the project.

## Skipping Hooks (When Needed)

If you need to bypass hooks (not recommended):

```bash
git commit --no-verify    # Skip pre-commit hook
git push --no-verify      # Skip pre-push hook
```

## Testing the Setup

1. Make a change to any JS/TS file with formatting issues
2. Try to commit it: `git add . && git commit -m "test"`
3. Watch as the pre-commit hook automatically fixes formatting and linting
4. If there are unfixable issues, the commit will be blocked

## Benefits

✅ Consistent code style across the entire codebase
✅ Catch errors before they reach the repository
✅ Automatic code formatting (no manual work)
✅ Type safety enforced before pushing
✅ Works for both JavaScript/TypeScript and Python
✅ Team collaboration made easier with shared standards
