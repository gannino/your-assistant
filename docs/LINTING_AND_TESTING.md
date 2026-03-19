# Linting and Testing Setup

This guide explains the linting and testing setup for Your Assistant, including ESLint, Prettier, and Jest configuration.

## Overview

The project includes a comprehensive code quality and testing setup:

- **ESLint**: JavaScript/TypeScript linting with Vue 3 support
- **Prettier**: Code formatting with consistent style
- **Jest**: Unit testing with Vue component testing support

## Available Commands

### Linting Commands

```bash
# Check for linting issues (no auto-fix)
npm run lint:check

# Fix linting issues automatically
npm run lint

# Run both linting and formatting checks
npm run lint:check && npm run format:check
```

### Formatting Commands

```bash
# Check for formatting issues
npm run format:check

# Format all files automatically
npm run format
```

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- src/utils/config_util.spec.js
```

## Configuration Files

### ESLint Configuration (`.eslintrc.js`)

- Extends `eslint:recommended` and `plugin:vue/vue3-recommended`
- Includes Prettier integration
- Configured for Vue 3 Composition API
- Disables console warnings in production
- Allows multi-word component names (for existing components)

### Prettier Configuration (`.prettierrc.js`)

- Single quotes for strings
- Semicolons required
- 2-space indentation
- 100 character line width
- LF line endings
- Arrow function parentheses avoided when possible

### Jest Configuration (`.jest.config.js`)

- Uses jsdom test environment
- Supports Vue 3 single-file components
- Collects coverage from source files
- Excludes main entry points and test files
- Includes setup file for global mocks

## Code Quality Rules

### ESLint Rules

- **Vue-specific**: Enforces Vue 3 best practices
- **Import rules**: Ensures proper import/export usage
- **Code style**: Consistent with Prettier formatting
- **Error prevention**: Catches common JavaScript mistakes
- **Production warnings**: Console statements flagged in production

### Prettier Rules

- **Consistent formatting**: Automatic code formatting
- **Team consistency**: Same formatting across all contributors
- **Reduced conflicts**: Fewer merge conflicts from formatting changes
- **Focus on logic**: Developers focus on code logic, not formatting

## Testing Setup

### Test Structure

```
src/
├── components/
│   ├── ComponentName.vue
│   └── ComponentName.spec.js
├── utils/
│   ├── utility.js
│   └── utility.spec.js
└── services/
    ├── service.js
    └── service.spec.js
```

### Test Examples

#### Utility Function Test

```javascript
import { describe, it, expect } from '@jest/globals'
import { utilityFunction } from '@/utils/utility'

describe('utilityFunction', () => {
  it('should return expected result', () => {
    const result = utilityFunction('input')
    expect(result).toBe('expected-output')
  })
})
```

#### Vue Component Test

```javascript
import { describe, it, expect } from '@jest/globals'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.exists()).toBe(true)
  })

  it('handles props correctly', () => {
    const wrapper = mount(MyComponent, {
      props: {
        message: 'Hello World'
      }
    })
    expect(wrapper.text()).toContain('Hello World')
  })
})
```

### Mocking

The test setup includes mocks for:

- **localStorage/sessionStorage**: Prevents test pollution
- **fetch**: Allows API response mocking
- **window.matchMedia**: Prevents browser API errors
- **Vue globals**: Provides consistent test environment

## Continuous Integration

### GitHub Actions Integration

The test workflow runs:

1. **Linting check**: `npm run lint:check`
2. **Formatting check**: `npm run format:check`
3. **Build verification**: `npm run build`
4. **Test execution**: `npm test`

### Pre-commit Hooks (Optional)

To run linting and formatting before commits:

```bash
# Install husky for git hooks
npm install --save-dev husky lint-staged

# Add to package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,vue}": [
      "npm run lint",
      "npm run format",
      "git add"
    ]
  }
}
```

## Best Practices

### Writing Tests

1. **Test one thing at a time**: Each test should have a single responsibility
2. **Use descriptive test names**: Clearly describe what the test does
3. **Test both success and failure cases**: Cover edge cases and error conditions
4. **Mock external dependencies**: Isolate the code being tested
5. **Keep tests independent**: Tests should not depend on each other

### Code Quality

1. **Fix linting issues immediately**: Don't let linting errors accumulate
2. **Run formatting before committing**: Keep code consistently formatted
3. **Write tests for new features**: Ensure new code is tested
4. **Update tests when refactoring**: Keep tests in sync with code changes
5. **Aim for good coverage**: Focus on critical paths and complex logic

### Performance

1. **Use test coverage selectively**: Don't test trivial code
2. **Mock expensive operations**: Database calls, API requests, etc.
3. **Run tests in parallel**: Jest runs tests in parallel by default
4. **Use watch mode during development**: Re-run tests on file changes

## Troubleshooting

### Common Issues

#### ESLint Errors

```bash
# Fix all auto-fixable issues
npm run lint

# Check specific file
npx eslint src/file.js

# Get detailed error information
npx eslint src/file.js --verbose
```

#### Prettier Formatting

```bash
# Format all files
npm run format

# Check specific file
npx prettier --check src/file.js

# Format specific file
npx prettier --write src/file.js
```

#### Jest Test Failures

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- src/utils/test.spec.js

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

#### Module Import Errors

If you get import errors in tests:

1. Check the `moduleNameMapper` in `jest.config.js`
2. Ensure the path alias matches your import
3. Verify the file exists at the specified path

#### Vue Component Testing

If Vue components don't render in tests:

1. Check that `vue-jest` is properly configured
2. Ensure the component is properly exported
3. Verify the test environment is set to `jsdom`

## IDE Integration

### VS Code Extensions

Install these extensions for better development experience:

- **ESLint**: Real-time linting feedback
- **Prettier - Code formatter**: Automatic formatting on save
- **Vue Language Features (Volar)**: Vue-specific features
- **Jest**: Test runner integration

### VS Code Settings

Add to your `.vscode/settings.json`:

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "vue"
  ],
  "prettier.requireConfig": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Migration from Existing Code

### Adding Tests to Existing Components

1. **Start with utilities**: Test utility functions first
2. **Add component tests**: Test component rendering and interactions
3. **Test services**: Test API calls and data processing
4. **Integration tests**: Test component interactions

### Fixing Linting Issues

1. **Run auto-fix**: `npm run lint` to fix auto-fixable issues
2. **Manual fixes**: Address remaining issues manually
3. **Configure rules**: Adjust rules if needed (document reasoning)
4. **Gradual improvement**: Don't try to fix everything at once

## Performance Optimization

### Fast Feedback

1. **Use watch mode**: `npm run test:watch` during development
2. **Run specific tests**: Test only changed files
3. **Parallel execution**: Jest runs tests in parallel by default
4. **Selective coverage**: Generate coverage only when needed

### CI/CD Optimization

The CI/CD pipeline has been optimized for performance and efficiency:

1. **Single dependency installation**: Dependencies installed once per workflow with hash-based caching
2. **Parallel job execution**: Lint/format and test jobs run in parallel
3. **Optimized caching**: Node modules cached using `package-lock.json` hash for >80% cache hit rate
4. **Build consolidation**: Both web and Electron builds created in single job
5. **Artifact reuse**: Platform builds download pre-built Vue apps

**Performance improvements:**
- Setup time: ~5 minutes → ~2 minutes
- Dependency installations: 6 per workflow → 1 per workflow
- Total pipeline time: ~6-8 minutes → ~4-6 minutes

For detailed CI/CD architecture, see [GitHub Actions Setup Guide](GITHUB_ACTIONS_SETUP.md).

This setup ensures code quality, consistency, and reliability while providing fast feedback during development.