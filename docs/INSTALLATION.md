# Installation Guide

This guide will help you install and set up the Browser Context Plugin for different browsers.

## Prerequisites

- Node.js 16+ and npm
- One of the supported browsers: Chrome, Edge, Safari, or Firefox

## Building the Extensions

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

This will create built extensions in the `dist/` directory for each browser.

## Chrome Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist/chrome/` directory
4. The extension should now appear in your extensions list

## Edge Installation

1. Open Edge and go to `edge://extensions/`
2. Enable "Developer mode" in the left sidebar
3. Click "Load unpacked" and select the `dist/edge/` directory
4. The extension should now appear in your extensions list

## Safari Installation

1. Open Safari and go to Safari > Preferences > Advanced
2. Check "Show Develop menu in menu bar"
3. Go to Develop > Show Extension Builder
4. Click the "+" button and select "Add Extension"
5. Navigate to the `dist/safari/` directory and select it
6. Click "Install" to install the extension

## Firefox Installation

1. Open Firefox and go to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the `dist/firefox/` directory and select `manifest.json`
5. The extension should now be loaded temporarily

For permanent installation, you'll need to package the extension as an XPI file.

## Configuration

After installation, click the extension icon in your browser toolbar to open the popup interface. Configure:

1. **Basic Settings**: Enable/disable auto scraping, set content length limits
2. **Schedule**: Set scraping time windows and days
3. **Filters**: Configure blacklist URLs and sensitive information filters
4. **Storage**: Set up your memory storage backend (Mem0AI, Zep, Letta, or Vector DB)

## Troubleshooting

### Extension not loading
- Make sure you're using a supported browser version
- Check that all files were built correctly in the dist directory
- Try reloading the extension

### Content not being scraped
- Verify the extension is enabled
- Check that the current page isn't in the blacklist
- Ensure the scraping schedule is active
- Check browser console for error messages

### Storage connection issues
- Verify your API endpoint and credentials
- Check network connectivity
- Ensure the storage service is running

## Development

To run in development mode:

```bash
npm run dev
```

This will watch for file changes and rebuild automatically.

To run tests:

```bash
npm test
```

To run linting:

```bash
npm run lint
```
