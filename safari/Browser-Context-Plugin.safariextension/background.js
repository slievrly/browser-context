/**
 * Safari extension background script
 * Manages core extension logic and storage
 */

// Safari extension API wrapper
const safari = window.safari;

class SafariBackgroundScript {
  constructor() {
    this.state = this.getDefaultState();
    this.init();
  }

  /**
   * Initialize background script
   */
  async init() {
    try {
      // Load saved state
      await this.loadState();
      
      // Setup message listeners
      this.setupMessageListener();
      
      // Setup storage listener
      this.setupStorageListener();
      
      // Start scheduler
      this.startScheduler();
      
      console.log('Browser Context Plugin background script initialized');
    } catch (error) {
      console.error('Failed to initialize background script:', error);
    }
  }

  /**
   * Get default state
   */
  getDefaultState() {
    return {
      isActive: false,
      currentConfig: {
        enabled: false,
        schedule: {
          startTime: '09:00',
          endTime: '18:00',
          days: [1, 2, 3, 4, 5] // Weekdays
        },
        blacklist: [],
        sensitiveFilters: {
          enabled: true,
          patterns: [],
          replacement: '[FILTERED]'
        },
        maxContentLength: 10000,
        delayBetweenPages: 1000
      },
      memoryConfig: {
        provider: 'mem0',
        endpoint: '',
        options: {}
      },
      stats: {
        totalPagesScraped: 0,
        errors: 0
      }
    };
  }

  /**
   * Load saved state
   */
  async loadState() {
    return new Promise((resolve) => {
      safari.extension.settings.getItem('pluginState', (result) => {
        if (result) {
          this.state = { ...this.state, ...result };
        }
        resolve();
      });
    });
  }

  /**
   * Save state
   */
  async saveState() {
    return new Promise((resolve) => {
      safari.extension.settings.setItem('pluginState', this.state, () => {
        resolve();
      });
    });
  }

  /**
   * Setup message listener
   */
  setupMessageListener() {
    safari.application.addEventListener('message', (event) => {
      const message = event.message;
      
      switch (message.type) {
        case 'GET_STATE':
          event.target.page.dispatchMessage('stateResponse', this.state);
          break;
          
        case 'UPDATE_CONFIG':
          this.handleUpdateConfig(message.config).then(() => {
            event.target.page.dispatchMessage('configUpdated', { success: true });
          });
          break;
          
        case 'UPDATE_MEMORY_CONFIG':
          this.handleUpdateMemoryConfig(message.config).then(() => {
            event.target.page.dispatchMessage('memoryConfigUpdated', { success: true });
          });
          break;
          
        case 'START_SCRAPING':
          this.handleStartScraping().then(() => {
            event.target.page.dispatchMessage('scrapingStarted', { success: true });
          });
          break;
          
        case 'STOP_SCRAPING':
          this.handleStopScraping().then(() => {
            event.target.page.dispatchMessage('scrapingStopped', { success: true });
          });
          break;
          
        case 'PAGE_SCRAPED':
          this.handlePageScraped(message.content).then(() => {
            event.target.page.dispatchMessage('pageSaved', { success: true });
          });
          break;
          
        case 'GET_STATS':
          event.target.page.dispatchMessage('statsResponse', this.state.stats);
          break;
          
        case 'CLEAR_DATA':
          this.handleClearData().then(() => {
            event.target.page.dispatchMessage('dataCleared', { success: true });
          });
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          event.target.page.dispatchMessage('error', { error: 'Unknown message type' });
      }
    });
  }

  /**
   * Setup storage listener
   */
  setupStorageListener() {
    // Safari doesn't have storage change events like Chrome
    // We'll handle this differently
  }

  /**
   * Start scheduler
   */
  startScheduler() {
    // Safari doesn't have alarms API, so we'll use setInterval
    setInterval(() => {
      this.checkSchedule();
    }, 60000); // Check every minute
  }

  /**
   * Check schedule
   */
  checkSchedule() {
    if (!this.state.isActive || !this.state.currentConfig.enabled) {
      return;
    }

    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
    const currentDay = now.getDay();

    // Check if current day is in schedule
    if (!this.state.currentConfig.schedule.days.includes(currentDay)) {
      return;
    }

    // Check if current time is in range
    const startTime = this.state.currentConfig.schedule.startTime;
    const endTime = this.state.currentConfig.schedule.endTime;

    if (this.isTimeInRange(currentTime, startTime, endTime)) {
      this.handleScheduledScraping();
    }
  }

  /**
   * Check if time is in range
   */
  isTimeInRange(currentTime, startTime, endTime) {
    const current = this.timeToMinutes(currentTime);
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start <= end) {
      return current >= start && current <= end;
    } else {
      return current >= start || current <= end;
    }
  }

  /**
   * Convert time to minutes
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Handle configuration update
   */
  async handleUpdateConfig(config) {
    this.state.currentConfig = config;
    await this.saveState();
  }

  /**
   * Handle memory configuration update
   */
  async handleUpdateMemoryConfig(config) {
    this.state.memoryConfig = config;
    await this.saveState();
  }

  /**
   * Handle start scraping
   */
  async handleStartScraping() {
    this.state.isActive = true;
    await this.saveState();
  }

  /**
   * Handle stop scraping
   */
  async handleStopScraping() {
    this.state.isActive = false;
    await this.saveState();
  }

  /**
   * Handle page scraped
   */
  async handlePageScraped(content) {
    try {
      // Update stats
      this.state.stats.totalPagesScraped++;
      this.state.stats.lastScrapedAt = Date.now();
      await this.saveState();

      console.log('Page scraped and saved:', content.url);
    } catch (error) {
      console.error('Failed to save scraped content:', error);
      this.state.stats.errors++;
      await this.saveState();
    }
  }

  /**
   * Handle clear data
   */
  async handleClearData() {
    try {
      this.state.stats = {
        totalPagesScraped: 0,
        errors: 0
      };
      
      await this.saveState();
      console.log('Data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  /**
   * Handle scheduled scraping
   */
  async handleScheduledScraping() {
    if (!this.state.isActive || !this.state.currentConfig.enabled) {
      return;
    }

    try {
      // Get active tab
      const activeTab = safari.application.activeBrowserWindow.activeTab;
      if (activeTab) {
        // Send message to content script
        activeTab.page.dispatchMessage('SCRAPE_PAGE', {});
      }
    } catch (error) {
      console.error('Scheduled scraping failed:', error);
    }
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }
}

// Initialize background script
new SafariBackgroundScript();
