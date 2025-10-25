# Contributing Guide

Thank you for your interest in contributing to the Browser Context Plugin! This guide will help you get started with development and contributing to the project.

## Development Setup

1. **Fork and clone the repository**:
```bash
git clone https://github.com/your-username/browser-context.git
cd browser-context
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up development environment**:
```bash
# Install development dependencies
npm install --save-dev

# Run tests
npm test

# Run linting
npm run lint

# Build all extensions
npm run build
```

## Project Structure

```
browser-context/
├── chrome/                 # Chrome extension
├── edge/                   # Edge extension
├── safari/                 # Safari extension
├── firefox/                # Firefox extension
├── shared/                 # Shared code
│   ├── content-script/     # Content scripts
│   ├── background/         # Background scripts
│   ├── popup/              # Popup interfaces
│   ├── memory-adapters/    # Memory storage adapters
│   └── utils/              # Utility functions
├── docs/                   # Documentation
├── tests/                  # Test files
├── scripts/                # Build scripts
└── webpack.*.config.js     # Webpack configurations
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write your code following the existing patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/your-test.test.ts

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Build extensions
npm run build
```

### 4. Test in Browsers

After building, test your changes in each browser:

- **Chrome**: Load `dist/chrome/` as unpacked extension
- **Edge**: Load `dist/edge/` as unpacked extension
- **Safari**: Load `dist/safari/` in Extension Builder
- **Firefox**: Load `dist/firefox/manifest.json` as temporary add-on

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

Follow the conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `test:` for test additions/changes
- `refactor:` for code refactoring
- `style:` for formatting changes

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow the existing type definitions
- Use strict type checking
- Prefer interfaces over types for object shapes

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_CASE for constants

### File Naming

- Use kebab-case for file names
- Use `.ts` extension for TypeScript files
- Use `.test.ts` for test files
- Use `.config.js` for configuration files

### Comments

- Use JSDoc comments for public APIs
- Use inline comments for complex logic
- Keep comments up to date with code changes

## Testing Guidelines

### Unit Tests

- Write tests for all public methods
- Test both success and error cases
- Use descriptive test names
- Mock external dependencies

### Integration Tests

- Test browser extension APIs
- Test memory adapter integrations
- Test cross-browser compatibility

### Test Structure

```typescript
describe('ComponentName', () => {
  let component: ComponentName;

  beforeEach(() => {
    component = new ComponentName();
  });

  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = component.methodName(input);
      
      // Assert
      expect(result).toBe('expected output');
    });

    it('should handle error cases', () => {
      // Test error handling
    });
  });
});
```

## Browser Extension Development

### Chrome/Edge Extensions

- Use Manifest V3
- Follow Chrome Extension best practices
- Use service workers for background scripts
- Implement proper error handling

### Safari Extensions

- Use Safari Extension API
- Follow Safari Extension guidelines
- Test in Safari Extension Builder
- Handle Safari-specific limitations

### Firefox Extensions

- Use WebExtensions API
- Follow Firefox Add-on guidelines
- Test in Firefox Developer Edition
- Handle Firefox-specific APIs

## Memory Adapter Development

### Creating New Adapters

1. Extend `BaseMemoryAdapter`
2. Implement all abstract methods
3. Add proper error handling
4. Write comprehensive tests
5. Update `MemoryAdapterFactory`

### Example Adapter Structure

```typescript
export class NewAdapter extends BaseMemoryAdapter {
  constructor(config: NewAdapterConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // Implementation
  }

  async save(content: WebPageContent): Promise<void> {
    // Implementation
  }

  // ... other methods
}
```

## Documentation

### API Documentation

- Update `docs/API.md` for new APIs
- Use JSDoc comments in code
- Include usage examples
- Document all parameters and return types

### User Documentation

- Update `docs/INSTALLATION.md` for installation changes
- Add new features to README
- Include screenshots for UI changes
- Document configuration options

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass
- [ ] Code is linted and formatted
- [ ] Documentation is updated
- [ ] Changes are tested in all browsers
- [ ] Commit messages follow conventional format

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Tested in Chrome
- [ ] Tested in Edge
- [ ] Tested in Safari
- [ ] Tested in Firefox

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release tag
4. Build and test all extensions
5. Create GitHub release
6. Publish to extension stores (if applicable)

## Getting Help

- Check existing issues and discussions
- Ask questions in GitHub Discussions
- Review existing code for patterns
- Check browser extension documentation

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's mission

Thank you for contributing to the Browser Context Plugin!
