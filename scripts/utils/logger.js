/**
 * Logging Utility
 *
 * Environment-aware logging system that:
 * - Uses different log levels based on NODE_ENV
 * - Adds timestamps and context
 * - Can be easily disabled in production
 * - Provides consistent formatting across the project
 */

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// Colors for console output (only in development)
const COLORS = {
  ERROR: "\x1b[31m", // Red
  WARN: "\x1b[33m", // Yellow
  INFO: "\x1b[36m", // Cyan
  DEBUG: "\x1b[90m", // Gray
  SUCCESS: "\x1b[32m", // Green
  RESET: "\x1b[0m", // Reset
};

// Icons for different log types
const ICONS = {
  ERROR: "❌",
  WARN: "⚠️ ",
  INFO: "ℹ️ ",
  DEBUG: "🔍",
  SUCCESS: "✅",
};

class Logger {
  constructor() {
    // Determine log level based on environment
    this.logLevel = this.getLogLevel();
    this.isProduction = process.env.NODE_ENV === "production";
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.useColors = !this.isProduction && process.stdout.isTTY;
  }

  getLogLevel() {
    const env = process.env.NODE_ENV || "development";
    const debugMode = process.env.DEBUG === "true";

    if (env === "production") {
      return debugMode ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    } else if (env === "test") {
      return LOG_LEVELS.ERROR;
    } else {
      return debugMode ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
    }
  }

  formatMessage(level, message, context = null) {
    const timestamp = new Date().toISOString();
    const icon = ICONS[level] || "";
    const color = this.useColors ? COLORS[level] : "";
    const reset = this.useColors ? COLORS.RESET : "";

    let formatted = `${color}${icon} [${timestamp}] ${level}: ${message}${reset}`;

    if (context) {
      formatted += `\n${color}   Context: ${JSON.stringify(context, null, 2)}${reset}`;
    }

    return formatted;
  }

  shouldLog(level) {
    return LOG_LEVELS[level] <= this.logLevel;
  }

  error(message, context = null) {
    if (this.shouldLog("ERROR")) {
      console.error(this.formatMessage("ERROR", message, context));
    }
  }

  warn(message, context = null) {
    if (this.shouldLog("WARN")) {
      console.warn(this.formatMessage("WARN", message, context));
    }
  }

  info(message, context = null) {
    if (this.shouldLog("INFO")) {
      console.log(this.formatMessage("INFO", message, context));
    }
  }

  debug(message, context = null) {
    if (this.shouldLog("DEBUG")) {
      console.log(this.formatMessage("DEBUG", message, context));
    }
  }

  success(message, context = null) {
    if (this.shouldLog("INFO")) {
      const color = this.useColors ? COLORS.SUCCESS : "";
      const reset = this.useColors ? COLORS.RESET : "";
      const timestamp = new Date().toISOString();

      let formatted = `${color}${ICONS.SUCCESS} [${timestamp}] SUCCESS: ${message}${reset}`;

      if (context) {
        formatted += `\n${color}   Context: ${JSON.stringify(context, null, 2)}${reset}`;
      }

      console.log(formatted);
    }
  }

  // Special methods for build scripts
  build(message) {
    if (this.shouldLog("INFO")) {
      const color = this.useColors ? COLORS.INFO : "";
      const reset = this.useColors ? COLORS.RESET : "";
      console.log(`${color}📦 ${message}${reset}`);
    }
  }

  progress(message) {
    if (this.shouldLog("INFO")) {
      const color = this.useColors ? COLORS.INFO : "";
      const reset = this.useColors ? COLORS.RESET : "";
      console.log(`${color}⏳ ${message}${reset}`);
    }
  }

  // Method to create scoped loggers for different modules
  scope(scopeName) {
    return {
      error: (message, context) =>
        this.error(`[${scopeName}] ${message}`, context),
      warn: (message, context) =>
        this.warn(`[${scopeName}] ${message}`, context),
      info: (message, context) =>
        this.info(`[${scopeName}] ${message}`, context),
      debug: (message, context) =>
        this.debug(`[${scopeName}] ${message}`, context),
      success: (message, context) =>
        this.success(`[${scopeName}] ${message}`, context),
      build: (message) => this.build(`[${scopeName}] ${message}`),
      progress: (message) => this.progress(`[${scopeName}] ${message}`),
    };
  }
}

// Create and export singleton instance
const logger = new Logger();

export default logger;

// Also export scoped loggers for common modules
export const buildLogger = logger.scope("BUILD");
export const apiLogger = logger.scope("API");
export const sanityLogger = logger.scope("SANITY");
export const imageLogger = logger.scope("IMAGE");
export const clientLogger = logger.scope("CLIENT");
