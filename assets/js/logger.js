/**
 * Client-side Logger
 * 
 * Environment-aware logging for browser JavaScript that:
 * - Respects production/development modes
 * - Can be completely disabled in production
 * - Provides consistent formatting
 * - Supports different log levels
 */

class ClientLogger {
  constructor() {
    // Check if we're in production (can be set via build process or domain check)
    this.isProduction = this.detectProductionMode();
    this.isEnabled = this.shouldEnableLogging();
    
    // Bind methods to preserve context
    this.error = this.error.bind(this);
    this.warn = this.warn.bind(this);
    this.info = this.info.bind(this);
    this.debug = this.debug.bind(this);
  }

  detectProductionMode() {
    // Check for production indicators
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Consider it production if:
    // - Custom domain (not localhost, not .local, not IP)
    // - HTTPS on custom domain
    // - BUILD_ENV is set to production (if available)
    if (typeof BUILD_ENV !== 'undefined' && BUILD_ENV === 'production') {
      return true;
    }
    
    if (hostname === 'localhost' || 
        hostname.endsWith('.local') || 
        hostname.match(/^\d+\.\d+\.\d+\.\d+$/) ||
        hostname.endsWith('.vercel.app')) {
      return false;
    }
    
    return protocol === 'https:' && !hostname.includes('staging');
  }

  shouldEnableLogging() {
    // Always allow error logging
    // Allow other logging only in development or if debug is enabled
    const debugParam = new URLSearchParams(window.location.search).get('debug');
    const debugStorage = localStorage.getItem('debug-logging');
    
    return !this.isProduction || debugParam === 'true' || debugStorage === 'true';
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] ${level}:`;
    
    if (data) {
      return [prefix, message, data];
    } else {
      return [prefix, message];
    }
  }

  error(message, data = null) {
    // Always log errors, even in production (they're important!)
    if (console.error) {
      console.error(...this.formatMessage('ERROR', message, data));
    }
  }

  warn(message, data = null) {
    if (this.isEnabled && console.warn) {
      console.warn(...this.formatMessage('WARN', message, data));
    }
  }

  info(message, data = null) {
    if (this.isEnabled && console.log) {
      console.log(...this.formatMessage('INFO', message, data));
    }
  }

  debug(message, data = null) {
    if (this.isEnabled && console.debug) {
      console.debug(...this.formatMessage('DEBUG', message, data));
    }
  }

  // Utility method to enable debug logging temporarily
  enableDebug() {
    localStorage.setItem('debug-logging', 'true');
    this.isEnabled = true;
    this.info('Debug logging enabled');
  }

  // Utility method to disable debug logging
  disableDebug() {
    localStorage.removeItem('debug-logging');
    this.isEnabled = this.shouldEnableLogging();
    console.log('Debug logging disabled');
  }

  // Create scoped loggers for different modules
  scope(scopeName) {
    return {
      error: (message, data) => this.error(`[${scopeName}] ${message}`, data),
      warn: (message, data) => this.warn(`[${scopeName}] ${message}`, data),
      info: (message, data) => this.info(`[${scopeName}] ${message}`, data),
      debug: (message, data) => this.debug(`[${scopeName}] ${message}`, data)
    };
  }
}

// Create singleton instance
const logger = new ClientLogger();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = logger;
}

// Global for older scripts
window.logger = logger;

// Scoped loggers for common client-side modules
window.formsLogger = logger.scope('FORMS');
window.searchLogger = logger.scope('SEARCH');
window.cookieLogger = logger.scope('COOKIES');
window.menuLogger = logger.scope('MENU');