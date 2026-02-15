# CLAUDE.md — packages/config

## What This Is

Shared TypeScript configuration for the monorepo. Contains `tsconfig.base.json` that all other packages extend.

## Rules

- **Don't modify** unless you're adding a new path alias or changing a compiler option that affects all packages.
- `strict: true` is enabled — all TypeScript must be fully typed.
- Path aliases: `@/*` maps to `./src/*` in consumer packages.

## When to Touch This

- Adding a new shared package that needs the base TS config
- Changing compiler targets
- That's it. Leave it alone otherwise.
