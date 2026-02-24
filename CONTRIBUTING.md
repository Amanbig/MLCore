# Contributing to MLCore

First off, thank you for considering contributing to MLCore! It's people like you that make MLCore such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](https://github.com/Amanbig/MLCore/issues) to see if someone has already reported it or requested it. If not, feel free to open a new issue using one of the provided templates.

## Local Development Setup

To set up the project locally, please refer to the [Development Setup](Readme.md#development-setup) section in the Readme.

### Backend (FastAPI)

We use `uv` for managing Python dependencies.

```bash
cd server
uv sync
uv run dev
```

Before submitting a pull request, ensure you run the linter and tests:

```bash
uv run ruff check .
```

### Frontend (React/Vite)

We use `npm` for managing Node dependencies and `biome` for linting and formatting.

```bash
cd client
npm install
npm run dev
```

Before submitting a pull request, run the following checks:

```bash
npm run format
npm run lint
```

## Pull Request Process

1. Fork the repo and create your branch from `main`.
2. Ensure your code satisfies the linting and formatting rules.
3. Update documentation if you are adding or modifying a feature.
4. Open a Pull Request! Please provide a clear description of the impact of the PR and link it to any relevant issues.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.
