# Quick Start Guide

Get up and running with the Browser Context Plugin in minutes!

## 🚀 Installation (5 minutes)

### Option 1: From Source (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/browser-context.git
cd browser-context

# 2. Install dependencies
npm install

# 3. Build extensions
npm run build
```

### Option 2: Download Pre-built

1. Go to [Releases](https://github.com/your-username/browser-context/releases)
2. Download the latest release
3. Extract the appropriate browser folder

## 📦 Browser Setup

### Chrome/Edge
1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/chrome/` (or `dist/edge/`) folder

### Safari
1. Open **Safari > Preferences > Advanced**
2. Check **Show Develop menu in menu bar**
3. Go to **Develop > Show Extension Builder**
4. Click **+** and select the `dist/safari/` folder
5. Click **Install**

### Firefox
1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `dist/firefox/manifest.json`

## ⚙️ Basic Configuration

1. **Click the extension icon** in your browser toolbar
2. **Enable Auto Scraping** in Basic Settings
3. **Set your schedule** (e.g., 9 AM - 6 PM, weekdays)
4. **Configure storage** (see Storage Setup below)

## 💾 Storage Setup

Choose one storage backend:

### Mem0AI (Easiest)
1. Get API key from [mem0.ai](https://mem0.ai)
2. Set endpoint: `https://api.mem0.ai`
3. Enter your API key
4. Set collection name: `browser-context`

### Zep
1. Get API key from [getzep.com](https://getzep.com)
2. Set endpoint: `https://api.zep.ai`
3. Enter your API key
4. Set collection name: `browser-context`

### Letta
1. Get API key from [letta.ai](https://letta.ai)
2. Set endpoint: `https://api.letta.ai`
3. Enter your API key
4. Set collection name: `browser-context`

### Vector Database
1. Choose provider (Pinecone, Weaviate, Qdrant, etc.)
2. Set your endpoint
3. Enter API key
4. Set collection name: `browser-context`

## 🎯 First Use

1. **Navigate to any webpage** you want to scrape
2. **Click the extension icon**
3. **Click "Start Scraping"** for manual scraping
4. **Or wait for automatic scraping** if enabled

## 🔧 Common Configurations

### Business Hours Scraping
- **Schedule**: 9:00 AM - 6:00 PM, Monday-Friday
- **Blacklist**: `*.admin.*`, `*.login`, `*.api.*`
- **Content Limit**: 10,000 characters

### 24/7 Scraping
- **Schedule**: 12:00 AM - 11:59 PM, All days
- **Blacklist**: `*.admin.*`, `*.login`
- **Content Limit**: 5,000 characters

### Research Mode
- **Schedule**: 8:00 AM - 10:00 PM, All days
- **Blacklist**: `*.ads.*`, `*.tracking.*`
- **Content Limit**: 20,000 characters
- **Sensitive Filter**: Enabled

## 🛠️ Troubleshooting

### Extension Not Working?
1. Check browser version compatibility
2. Reload the extension
3. Check browser console for errors
4. Verify permissions are granted

### Content Not Being Scraped?
1. Ensure auto scraping is enabled
2. Check if page is in blacklist
3. Verify schedule is active
4. Check storage configuration

### Storage Issues?
1. Verify API endpoint and key
2. Check network connectivity
3. Ensure storage service is running
4. Review error logs

## 📚 Next Steps

- **Read the [User Guide](USER_GUIDE.md)** for detailed configuration
- **Check the [API Documentation](API.md)** for advanced usage
- **See [Development Guide](DEVELOPMENT_GUIDE.md)** for contributing
- **Visit [GitHub Issues](https://github.com/your-username/browser-context/issues)** for support

## 🎉 You're Ready!

The Browser Context Plugin is now installed and configured. It will automatically scrape content from web pages according to your settings and save it to your chosen storage backend.

**Happy scraping!** 🚀
