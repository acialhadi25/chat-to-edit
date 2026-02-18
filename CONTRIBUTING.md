# Contributing to ChaTtoEdit

Thank you for your interest in contributing to ChaTtoEdit! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Setup

1. Fork the repository
2. Clone your fork:

   ```bash
   git clone https://github.com/your-username/chattoedit.git
   cd chattoedit
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Test additions/updates

### Making Changes

1. Create a new branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following the coding standards

3. Write or update tests for your changes

4. Run tests and linting:

   ```bash
   npm test
   npm run lint
   npm run format
   ```

5. Commit your changes following the commit message guidelines

6. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

7. Create a Pull Request

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types - use `unknown` or proper types
- Add JSDoc comments to all public functions
- Use explicit return types for functions

### Code Style

- Use Prettier for formatting (runs automatically on save)
- Follow ESLint rules (runs automatically on commit)
- Use functional components with hooks
- Prefer `const` over `let`, avoid `var`

### File Organization

- One component per file
- Co-locate tests with source files in `__tests__/` directories
- Group related files in feature directories

### Naming Conventions

- **Components**: PascalCase (e.g., `ExcelPreview.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useUndoRedo.ts`)
- **Utils**: camelCase (e.g., `excelOperations.ts`)
- **Types**: PascalCase (e.g., `ExcelData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_HISTORY`)

### Component Structure

```typescript
/**
 * Component description
 */
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. Derived state
  const derivedValue = useMemo(() => {}, []);

  // 3. Event handlers
  const handleEvent = useCallback(() => {}, []);

  // 4. Effects
  useEffect(() => {}, []);

  // 5. Render
  return <div>{/* JSX */}</div>;
}
```

## Testing Guidelines

### Unit Tests

- Write tests for all utility functions
- Target 80% coverage for utils, 70% for hooks, 60% for components
- Use descriptive test names: `it('should do X when Y')`
- Test behavior, not implementation

### Integration Tests

- Test component interactions
- Test critical user flows
- Use MSW for API mocking

### E2E Tests

- Test complete user journeys
- Run on multiple browsers
- Include mobile testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run with coverage
npm test -- --coverage
```

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): subject

body

footer
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Build process or auxiliary tool changes
- `perf`: Performance improvements

### Examples

```
feat(excel): add freeze panes functionality

Implement freeze panes feature allowing users to freeze
rows and columns while scrolling.

Closes #123
```

```
fix(chat): resolve message duplication issue

Fixed bug where messages were duplicated when switching
between files.

Fixes #456
```

## Pull Request Process

1. **Update Documentation**: Update README.md or other docs if needed

2. **Add Tests**: Ensure your changes are covered by tests

3. **Run Quality Checks**:

   ```bash
   npm run lint
   npm run format:check
   npm test
   npm run test:e2e
   ```

4. **Update CHANGELOG**: Add your changes to CHANGELOG.md (if applicable)

5. **Create PR**: Use the PR template and fill in all sections

6. **Code Review**: Address any feedback from reviewers

7. **CI Checks**: Ensure all CI checks pass

8. **Merge**: Once approved, your PR will be merged

### PR Requirements

- [ ] All tests pass
- [ ] Code coverage maintained or improved
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Documentation updated
- [ ] CHANGELOG updated (if applicable)
- [ ] At least one approval from maintainers

## Project Structure

```
chat-to-edit/
├── src/
│   ├── components/     # React components
│   │   ├── ui/        # UI primitives (shadcn/ui)
│   │   ├── dashboard/ # Dashboard components
│   │   ├── excel/     # Excel-specific components
│   │   └── landing/   # Landing page components
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   │   ├── excel/     # Excel operations
│   │   └── formulas/  # Formula evaluation
│   ├── types/         # TypeScript type definitions
│   ├── lib/           # Third-party library configs
│   └── test/          # Test utilities and mocks
├── e2e/               # E2E tests (Playwright)
├── public/            # Static assets
└── .github/           # GitHub workflows and templates
```

## Getting Help

- **Documentation**: Check the README files in each directory
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions

## Recognition

Contributors will be recognized in:

- CHANGELOG.md for their contributions
- GitHub contributors page
- Project README (for significant contributions)

Thank you for contributing to ChaTtoEdit! 🎉
