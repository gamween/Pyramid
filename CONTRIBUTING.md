# Contributing to Pyramid

Thank you for your interest in contributing! This document provides guidelines and instructions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/gamween/Pyramid.git`
3. Install dependencies: `pnpm install`
4. Create a dedicated branch from the approved working branch for your change set

## Development Workflow

### Running the Development Server

```bash
pnpm dev
```

### Building

```bash
pnpm build
```

### Linting and Formatting

```bash
pnpm --filter web lint
pnpm format
```

## Branching

1. Create a dedicated implementation branch from the approved working branch, not from `main`.
2. Keep documentation and verification changes in the same branch as the code they describe.

## Project Structure

- `apps/web` — Next.js 16.1.6 / React 19 frontend (lending, watcher-proxied trading, dashboard)
- `apps/watcher` — Node.js watcher bot (price monitoring, order execution)
- `packages/zkp` — RISC0 ZK guest program + CLI prover
- `docs/specs` — Design specification

## Naming Conventions

- **Components:** PascalCase (`VaultDeposit.js`, `OrderCard.js`)
- **Hooks:** camelCase with `use` prefix (`usePrice.js`, `useVault.js`)
- **Utils/lib:** camelCase (`constants.js`, `networks.js`)
- **Watcher modules:** kebab-case (`devnet-loop.js`, `zk-prover.js`)
- **Variables:** camelCase (`triggerPrice`, `vaultId`)
- **Constants:** UPPER_SNAKE_CASE (`ORDER_STATUS`, `SIDES`)

## Code Style

- Use Prettier for code formatting (configured in `.prettierrc`)
- Follow existing code patterns and conventions
- Commit messages: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:` prefix

## Making Changes

### Adding New Features

1. Create a new implementation branch from the approved working branch
2. Implement your feature
3. Test thoroughly on Devnet
4. Submit a pull request

### Fixing Bugs

1. Create an issue describing the bug
2. Reference the issue in your pull request
3. Include steps to reproduce and test the fix

## Pull Request Process

1. Update documentation for any new features
2. Ensure all code is formatted (`pnpm format`)
3. Reference any related issues in the PR description
4. Wait for review from maintainers

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
