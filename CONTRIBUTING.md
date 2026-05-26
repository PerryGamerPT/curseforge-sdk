# Contributing

Thank you for contributing to `curseforge-sdk`.

## Commit Convention

We use Conventional Commits so semantic-release can generate versions and release notes automatically.

Use the following format:

`<type>(<scope>): <summary>`

Common types include:

- `feat:` for new functionality
- `fix:` for bug fixes
- `chore:` for maintenance tasks
- `docs:` for documentation updates
- `refactor:` for internal code changes
- `test:` for test-only changes

Examples:

- `feat(core): add mod lookup helper`
- `fix(http): honor x-ratelimit-reset headers`
- `docs(readme): expand error handling example`

## Development Workflow

1. Clone the repository.
2. Run `pnpm install` to install dependencies.
3. Run `pnpm test` and make sure the test suite passes.
4. Make your changes.
5. Open a Pull Request when the branch is ready.

## Coding Style

- Use strict TypeScript patterns and keep the codebase type-safe.
- Add JSDoc for every new public method.
- Keep changes focused and consistent with the existing architecture.

## Merge Requirements

- CI/CD must pass before any merge.
- All tests and lint checks must be green before a Pull Request is approved and merged.
