# Browser Context Plugin

A cross-browser web content scraping and parsing plugin with support for multiple memory storage backends.

## Supported Browsers
- Chrome 88+
- Edge 88+
- Safari 14+
- Firefox 78+

## Features
- **Web Content Scraping**: Intelligent extraction of web page content, metadata, and structure
- **Scheduled Scraping**: Configurable time windows and days for automated content collection
- **URL Blacklist Filtering**: Advanced pattern matching to exclude unwanted URLs
- **Sensitive Information Filtering**: Regex-based filtering to protect sensitive data
- **Memory Storage Integration**: Support for multiple storage backends
- **Vector Database Support**: Integration with popular vector databases
- **Cross-Browser Compatibility**: Native support for all major browsers
- **User-Friendly Interface**: Intuitive popup interface for configuration and monitoring

## Memory Storage Backends
- **Mem0AI** (mem0ai/mem0)
- **Zep** (getzep/zep)
- **Letta** (letta-ai/letta)
- **Vector Databases**: Pinecone, Weaviate, Qdrant, Chroma, Milvus

## Quick Start

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/browser-context.git
cd browser-context
```

2. Install dependencies:
```bash
npm install
```

3. Build all extensions:
```bash
npm run build
```

4. Load the extension in your browser:
   - **Chrome/Edge**: Load `dist/chrome/` or `dist/edge/` as unpacked extension
   - **Safari**: Load `dist/safari/` in Extension Builder
   - **Firefox**: Load `dist/firefox/manifest.json` as temporary add-on

### Configuration

1. Click the extension icon in your browser toolbar
2. Configure your settings:
   - **Basic Settings**: Enable auto scraping, set content limits
   - **Schedule**: Set scraping time windows and days
   - **Filters**: Configure blacklist URLs and sensitive information filters
   - **Storage**: Set up your memory storage backend

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
└── scripts/                # Build scripts
```

## Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build extensions
npm run build

# Development mode with watch
npm run dev
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/content-scraper.test.ts
```

## API Documentation

See [API Documentation](docs/API.md) for detailed API reference.

## Installation Guide

See [Installation Guide](docs/INSTALLATION.md) for detailed installation instructions.

## Contributing

See [Contributing Guide](docs/CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Security

This plugin includes built-in security features:
- Sensitive information filtering
- URL blacklist protection
- Secure API key handling
- Content sanitization
- Privacy-focused design

## Performance

- Efficient content extraction algorithms
- Configurable content length limits
- Optimized page load handling
- Memory usage optimization
- Background processing for minimal impact

## Support

- Check [Issues](https://github.com/your-username/browser-context/issues) for known issues
- Create a new issue for bug reports or feature requests
- See [Documentation](docs/) for detailed guides
