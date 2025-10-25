/**
 * Safari extension popup page script
 * Manages user interface and configuration
 */

// Safari extension API wrapper
const safari = window.safari;

class SafariPopupController {
  constructor() {
    this.state = null;
    this.currentTab = 'basic';
    this.init();
  }

  /**
   * Initialize popup page
   */
  async init() {
    try {
      // Load state
      await this.loadState();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize UI
      this.initializeUI();
      
      // Hide loading state
      this.hideLoading();
    } catch (error) {
      this.showError('Initialization failed: ' + error.message);
    }
  }

  /**
   * Load state
   */
  async loadState() {
    return new Promise((resolve, reject) => {
      safari.self.tab.dispatchMessage('GET_STATE', {});
      
      safari.self.addEventListener('message', (event) => {
        if (event.name === 'stateResponse') {
          this.state = event.message;
          resolve();
        }
      });
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Control buttons
    document.getElementById('start-btn')?.addEventListener('click', () => this.startScraping());
    document.getElementById('stop-btn')?.addEventListener('click', () => this.stopScraping());
    document.getElementById('clear-btn')?.addEventListener('click', () => this.clearData());
    document.getElementById('save-btn')?.addEventListener('click', () => this.saveConfig());

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target.dataset.tab;
        if (target) {
          this.switchTab(target);
        }
      });
    });

    // Configuration change listeners
    this.setupConfigListeners();
  }

  /**
   * Setup configuration listeners
   */
  setupConfigListeners() {
    // Basic configuration
    document.getElementById('enabled-checkbox')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('max-content-length')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('delay-between-pages')?.addEventListener('change', () => this.updateConfig());

    // Schedule
    document.getElementById('start-time')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('end-time')?.addEventListener('change', () => this.updateConfig());
    document.querySelectorAll('#schedule-days input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateConfig());
    });

    // Filter settings
    document.getElementById('blacklist-textarea')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('sensitive-filters-enabled')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('sensitive-replacement')?.addEventListener('change', () => this.updateConfig());
    document.getElementById('sensitive-patterns')?.addEventListener('change', () => this.updateConfig());

    // Storage settings
    document.getElementById('memory-provider')?.addEventListener('change', () => this.updateMemoryConfig());
    document.getElementById('memory-endpoint')?.addEventListener('change', () => this.updateMemoryConfig());
    document.getElementById('memory-api-key')?.addEventListener('change', () => this.updateMemoryConfig());
    document.getElementById('memory-collection')?.addEventListener('change', () => this.updateMemoryConfig());
  }

  /**
   * Initialize UI
   */
  initializeUI() {
    if (!this.state) return;

    // Update status display
    this.updateStatusDisplay();
    
    // Update configuration form
    this.updateConfigForm();
    
    // Update storage configuration form
    this.updateMemoryConfigForm();
  }

  /**
   * Update status display
   */
  updateStatusDisplay() {
    if (!this.state) return;

    // Status indicator
    const indicator = document.getElementById('status-indicator');
    if (indicator) {
      indicator.className = `status-indicator ${this.state.isActive ? '' : 'inactive'}`;
    }

    // Statistics
    const totalPages = document.getElementById('total-pages');
    if (totalPages) {
      totalPages.textContent = this.state.stats.totalPagesScraped.toString();
    }

    const lastScraped = document.getElementById('last-scraped');
    if (lastScraped) {
      if (this.state.stats.lastScrapedAt) {
        const date = new Date(this.state.stats.lastScrapedAt);
        lastScraped.textContent = date.toLocaleTimeString();
      } else {
        lastScraped.textContent = '-';
      }
    }
  }

  /**
   * Update configuration form
   */
  updateConfigForm() {
    if (!this.state) return;

    const config = this.state.currentConfig;

    // Basic configuration
    document.getElementById('enabled-checkbox').checked = config.enabled;
    document.getElementById('max-content-length').value = config.maxContentLength.toString();
    document.getElementById('delay-between-pages').value = config.delayBetweenPages.toString();

    // Schedule
    document.getElementById('start-time').value = config.schedule.startTime;
    document.getElementById('end-time').value = config.schedule.endTime;
    
    // Day selection
    document.querySelectorAll('#schedule-days input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = config.schedule.days.includes(parseInt(checkbox.value));
    });

    // Blacklist
    document.getElementById('blacklist-textarea').value = config.blacklist.join('\n');

    // Sensitive information filter
    document.getElementById('sensitive-filters-enabled').checked = config.sensitiveFilters.enabled;
    document.getElementById('sensitive-replacement').value = config.sensitiveFilters.replacement;
    document.getElementById('sensitive-patterns').value = config.sensitiveFilters.patterns.join('\n');
  }

  /**
   * Update storage configuration form
   */
  updateMemoryConfigForm() {
    if (!this.state) return;

    const memoryConfig = this.state.memoryConfig;

    document.getElementById('memory-provider').value = memoryConfig.provider;
    document.getElementById('memory-endpoint').value = memoryConfig.endpoint;
    document.getElementById('memory-api-key').value = memoryConfig.apiKey || '';
    document.getElementById('memory-collection').value = memoryConfig.options.collection || '';
  }

  /**
   * Switch tab
   */
  switchTab(tabName) {
    // Update tab state
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

    // Update content display
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`)?.classList.add('active');

    this.currentTab = tabName;
  }

  /**
   * Start scraping
   */
  async startScraping() {
    try {
      safari.self.tab.dispatchMessage('START_SCRAPING', {});
      this.showSuccess('Scraping started');
      await this.loadState();
      this.updateStatusDisplay();
    } catch (error) {
      this.showError('Failed to start scraping: ' + error.message);
    }
  }

  /**
   * Stop scraping
   */
  async stopScraping() {
    try {
      safari.self.tab.dispatchMessage('STOP_SCRAPING', {});
      this.showSuccess('Scraping stopped');
      await this.loadState();
      this.updateStatusDisplay();
    } catch (error) {
      this.showError('Failed to stop scraping: ' + error.message);
    }
  }

  /**
   * Clear data
   */
  async clearData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    try {
      safari.self.tab.dispatchMessage('CLEAR_DATA', {});
      this.showSuccess('Data cleared');
      await this.loadState();
      this.updateStatusDisplay();
    } catch (error) {
      this.showError('Failed to clear data: ' + error.message);
    }
  }

  /**
   * Update configuration
   */
  updateConfig() {
    if (!this.state) return;

    const config = {
      enabled: document.getElementById('enabled-checkbox').checked,
      schedule: {
        startTime: document.getElementById('start-time').value,
        endTime: document.getElementById('end-time').value,
        days: Array.from(document.querySelectorAll('#schedule-days input[type="checkbox"]:checked'))
          .map(cb => parseInt(cb.value))
      },
      blacklist: document.getElementById('blacklist-textarea').value
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0),
      sensitiveFilters: {
        enabled: document.getElementById('sensitive-filters-enabled').checked,
        patterns: document.getElementById('sensitive-patterns').value
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0),
        replacement: document.getElementById('sensitive-replacement').value
      },
      maxContentLength: parseInt(document.getElementById('max-content-length').value),
      delayBetweenPages: parseInt(document.getElementById('delay-between-pages').value)
    };

    this.state.currentConfig = config;
  }

  /**
   * Update storage configuration
   */
  updateMemoryConfig() {
    if (!this.state) return;

    const memoryConfig = {
      provider: document.getElementById('memory-provider').value,
      endpoint: document.getElementById('memory-endpoint').value,
      apiKey: document.getElementById('memory-api-key').value,
      options: {
        collection: document.getElementById('memory-collection').value
      }
    };

    this.state.memoryConfig = memoryConfig;
  }

  /**
   * Save configuration
   */
  async saveConfig() {
    try {
      this.updateConfig();
      this.updateMemoryConfig();

      if (this.state) {
        safari.self.tab.dispatchMessage('UPDATE_CONFIG', { config: this.state.currentConfig });
        safari.self.tab.dispatchMessage('UPDATE_MEMORY_CONFIG', { config: this.state.memoryConfig });
        this.showSuccess('Configuration saved');
      }
    } catch (error) {
      this.showError('Failed to save configuration: ' + error.message);
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    document.getElementById('loading')?.style.setProperty('display', 'none');
    document.getElementById('main-content')?.style.setProperty('display', 'block');
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // Simple success notification
    console.log('Success:', message);
  }
}

// Initialize popup controller
new SafariPopupController();
