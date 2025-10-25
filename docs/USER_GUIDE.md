# User Guide

This comprehensive guide will help you install, configure, and use the Browser Context Plugin effectively.

## Table of Contents

1. [Installation](#installation)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Features](#advanced-features)

## Installation

### Prerequisites

- **Chrome**: Version 88 or higher
- **Edge**: Version 88 or higher
- **Safari**: Version 14 or higher (macOS 11 or later)
- **Firefox**: Version 78 or higher

### Method 1: Install from Source (Recommended for Development)

1. **Clone the repository**:
```bash
git clone https://github.com/your-username/browser-context.git
cd browser-context
```

2. **Install dependencies**:
```bash
npm install
```

3. **Build the extensions**:
```bash
npm run build
```

4. **Load the extension in your browser** (see browser-specific instructions below)

### Method 2: Download Pre-built Extensions

Download the latest release from the [Releases page](https://github.com/your-username/browser-context/releases) and extract the appropriate browser folder.

### Browser-Specific Installation

#### Chrome Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** in the top-right corner
3. Click **Load unpacked**
4. Select the `dist/chrome/` folder from the project
5. The extension should appear in your extensions list
6. Click the extension icon in the toolbar to pin it

#### Edge Installation

1. Open Edge and navigate to `edge://extensions/`
2. Enable **Developer mode** in the left sidebar
3. Click **Load unpacked**
4. Select the `dist/edge/` folder from the project
5. The extension should appear in your extensions list
6. Click the extension icon in the toolbar to pin it

#### Safari Installation

1. Open Safari and go to **Safari > Preferences > Advanced**
2. Check **Show Develop menu in menu bar**
3. Go to **Develop > Show Extension Builder**
4. Click the **+** button and select **Add Extension**
5. Navigate to the `dist/safari/` folder and select it
6. Click **Install** to install the extension
7. Enable the extension in **Safari > Preferences > Extensions**

#### Firefox Installation

1. Open Firefox and navigate to `about:debugging`
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on**
4. Navigate to the `dist/firefox/` folder and select `manifest.json`
5. The extension should be loaded temporarily

**Note**: For permanent installation, you'll need to package the extension as an XPI file or submit it to the Firefox Add-ons store.

## Initial Setup

### First Launch

1. **Click the extension icon** in your browser toolbar
2. **Accept the permissions** when prompted
3. **Configure basic settings** in the popup interface

### Required Permissions

The extension requires the following permissions:
- **Active Tab**: To access the current page content
- **Storage**: To save configuration and data
- **Tabs**: To manage multiple tabs
- **Scripting**: To inject content scripts
- **Alarms**: For scheduled scraping
- **Background**: For background processing
- **All URLs**: To work on any website

## Configuration

### Basic Settings

1. **Open the extension popup** by clicking the icon
2. **Navigate to the "Basic Settings" tab**
3. **Configure the following**:

#### Enable Auto Scraping
- Toggle the **Enable Auto Scraping** checkbox
- This controls whether the extension automatically scrapes content

#### Content Limits
- **Max Content Length**: Set the maximum number of characters to scrape (default: 10,000)
- **Delay Between Pages**: Set the delay in milliseconds between page scrapes (default: 1,000ms)

### Schedule Settings

1. **Navigate to the "Schedule" tab**
2. **Configure scraping times**:

#### Time Range
- **Start Time**: When to begin scraping (24-hour format)
- **End Time**: When to stop scraping (24-hour format)

#### Days of Week
- Select which days of the week to scrape
- **Monday-Friday**: Business days (default)
- **Weekend**: Saturday and Sunday
- **Custom**: Select specific days

#### Example Configurations
```
Business Hours: 09:00 - 18:00, Monday-Friday
Night Shift: 22:00 - 06:00, Monday-Friday
24/7: 00:00 - 23:59, All days
```

### Filter Settings

1. **Navigate to the "Filters" tab**
2. **Configure URL blacklist**:

#### Blacklist Patterns
Add URL patterns to exclude from scraping:
```
*.admin.*          # Exclude admin pages
*.login            # Exclude login pages
*.api.*            # Exclude API endpoints
/private/*         # Exclude private sections
*.example.com      # Exclude specific domain
```

#### Sensitive Information Filter
- **Enable Filtering**: Toggle sensitive information filtering
- **Replacement Text**: What to replace sensitive data with (default: [FILTERED])
- **Custom Patterns**: Add your own regex patterns

#### Built-in Patterns
The extension includes patterns for:
- Email addresses
- Phone numbers (Chinese format)
- Credit card numbers
- API keys and passwords
- IP addresses
- Social security numbers

### Storage Settings

1. **Navigate to the "Storage" tab**
2. **Select a storage provider**:

#### Mem0AI
- **Endpoint**: `https://api.mem0.ai`
- **API Key**: Your Mem0AI API key
- **Collection**: Collection name (default: browser-context)

#### Zep
- **Endpoint**: `https://api.zep.ai`
- **API Key**: Your Zep API key
- **Collection**: Collection name (default: browser-context)

#### Letta
- **Endpoint**: `https://api.letta.ai`
- **API Key**: Your Letta API key
- **Collection**: Collection name (default: browser-context)

#### Vector Database
- **Provider**: Pinecone, Weaviate, Qdrant, Chroma, or Milvus
- **Endpoint**: Your vector database endpoint
- **API Key**: Your API key
- **Collection**: Collection name (default: browser-context)
- **Dimension**: Vector dimension (default: 1536)
- **Distance Metric**: cosine, euclidean, or dotproduct

## Usage

### Manual Scraping

1. **Navigate to any webpage** you want to scrape
2. **Click the extension icon** in the toolbar
3. **Click "Start Scraping"** to begin manual scraping
4. **The extension will**:
   - Extract the page content
   - Apply filters
   - Save to your configured storage backend
   - Update statistics

### Automatic Scraping

1. **Enable auto scraping** in the configuration
2. **Set your schedule** for when to scrape
3. **The extension will automatically**:
   - Check if the current time is within your schedule
   - Verify the page isn't blacklisted
   - Scrape content from active tabs
   - Save to storage

### Monitoring

1. **View statistics** in the extension popup:
   - **Pages Scraped**: Total number of pages scraped
   - **Last Scraped**: When the last page was scraped
   - **Status Indicator**: Green (active) or Red (inactive)

2. **Check logs** in the browser console for debugging

### Data Management

1. **View saved data** through your storage provider's interface
2. **Search content** using your storage provider's search functionality
3. **Clear data** using the "Clear Data" button in the extension popup

## Troubleshooting

### Common Issues

#### Extension Not Loading
**Symptoms**: Extension doesn't appear in browser
**Solutions**:
- Check browser version compatibility
- Verify all files are present in the dist folder
- Try reloading the extension
- Check browser console for errors

#### Content Not Being Scraped
**Symptoms**: No content is being saved
**Solutions**:
- Verify auto scraping is enabled
- Check if the page is in the blacklist
- Ensure the schedule is active
- Check storage configuration
- Verify API keys are correct

#### Storage Connection Issues
**Symptoms**: Cannot save to storage backend
**Solutions**:
- Verify API endpoint is correct
- Check API key validity
- Ensure network connectivity
- Check storage service status
- Review error logs in console

#### Performance Issues
**Symptoms**: Browser becomes slow or unresponsive
**Solutions**:
- Reduce max content length
- Increase delay between pages
- Add more URLs to blacklist
- Check for memory leaks in console

### Debug Mode

1. **Open browser developer tools** (F12)
2. **Go to Console tab**
3. **Look for messages** starting with "Browser Context Plugin"
4. **Check for errors** and warnings

### Log Levels

The extension provides different log levels:
- **Info**: General information about operations
- **Warn**: Non-critical issues
- **Error**: Critical errors that prevent functionality

## Advanced Features

### Custom Content Selectors

You can customize which content gets scraped by modifying the content selectors in the source code:

```typescript
const contentSelectors = [
  'main',
  'article',
  '[role="main"]',
  '.content',
  '.main-content',
  '.post-content',
  '.entry-content',
  '#content',
  '.container'
];
```

### Custom Sensitive Patterns

Add your own regex patterns for sensitive information:

```typescript
const customPatterns = [
  '\\b\\d{4}-\\d{2}-\\d{2}\\b',  // Date pattern
  '\\b[A-Z]{2}\\d{6}\\b',        // License plate
  '\\b\\d{3}-\\d{2}-\\d{4}\\b'   // SSN
];
```

### API Integration

The extension exposes a global API for programmatic control:

```javascript
// Check if URL is blacklisted
const isBlacklisted = window.browserContextPlugin.isBlacklisted('https://example.com');

// Scrape current page
const content = await window.browserContextPlugin.scrapePage();

// Filter sensitive information
const filtered = window.browserContextPlugin.filterSensitiveInfo('Contact: john@example.com');
```

### Batch Processing

For processing multiple pages:

1. **Open multiple tabs** with pages you want to scrape
2. **Enable auto scraping**
3. **Set a schedule** that covers your browsing time
4. **The extension will process each tab** according to your configuration

### Data Export

Export your scraped data:

1. **Use your storage provider's export functionality**
2. **Or access the data programmatically** through the storage API
3. **Format the data** as needed (JSON, CSV, etc.)

### Backup and Restore

1. **Backup configuration** by copying the storage settings
2. **Backup data** through your storage provider
3. **Restore** by re-entering the same configuration

## Best Practices

### Performance Optimization

1. **Set appropriate content limits** based on your needs
2. **Use blacklists** to exclude unnecessary pages
3. **Schedule scraping** during off-peak hours
4. **Monitor resource usage** regularly

### Privacy and Security

1. **Review sensitive information patterns** regularly
2. **Use secure storage backends** with encryption
3. **Limit API key permissions** to minimum required
4. **Regularly clear old data** if not needed

### Maintenance

1. **Update the extension** regularly
2. **Monitor storage usage** and costs
3. **Review and update patterns** as needed
4. **Check logs** for any issues

## Support

### Getting Help

1. **Check the documentation** for common issues
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join discussions** in GitHub Discussions

### Reporting Issues

When reporting issues, include:
- Browser version and type
- Extension version
- Steps to reproduce
- Error messages from console
- Configuration details (without sensitive information)

### Contributing

See the [Contributing Guide](CONTRIBUTING.md) for information on how to contribute to the project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
