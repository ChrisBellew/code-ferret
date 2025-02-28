/**
 * Logging Service
 * 
 * Provides structured logging with different log levels and output destinations.
 */

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  NONE = 6
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

export interface LogFormatter {
  format(entry: LogEntry): string;
}

export interface LogTransport {
  log(entry: LogEntry): void;
  setFormatter(formatter: LogFormatter): void;
  setMinLevel(level: LogLevel): void;
}

export class SimpleFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp.toISOString();
    let message = `[${timestamp}] ${levelName}: ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += ` ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      message += `\n${entry.error.stack || entry.error.message}`;
    }
    
    return message;
  }
}

export class JsonFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const formatted: Record<string, any> = {
      timestamp: entry.timestamp.toISOString(),
      level: LogLevel[entry.level],
      message: entry.message
    };
    
    if (entry.context) {
      formatted.context = entry.context;
    }
    
    if (entry.error) {
      formatted.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack
      };
    }
    
    return JSON.stringify(formatted);
  }
}

export class ConsoleTransport implements LogTransport {
  private formatter: LogFormatter;
  private minLevel: LogLevel;
  
  constructor(formatter: LogFormatter = new SimpleFormatter(), minLevel: LogLevel = LogLevel.INFO) {
    this.formatter = formatter;
    this.minLevel = minLevel;
  }
  
  log(entry: LogEntry): void {
    if (entry.level < this.minLevel) {
      return;
    }
    
    const formatted = this.formatter.format(entry);
    
    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }
  
  setFormatter(formatter: LogFormatter): void {
    this.formatter = formatter;
  }
  
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export class FileTransport implements LogTransport {
  private formatter: LogFormatter;
  private minLevel: LogLevel;
  private filePath: string;
  
  constructor(filePath: string, formatter: LogFormatter = new SimpleFormatter(), minLevel: LogLevel = LogLevel.INFO) {
    this.filePath = filePath;
    this.formatter = formatter;
    this.minLevel = minLevel;
  }
  
  log(entry: LogEntry): void {
    if (entry.level < this.minLevel) {
      return;
    }
    
    const formatted = this.formatter.format(entry);
    
    // In a real implementation, this would write to a file
    console.log(`[FILE ${this.filePath}] ${formatted}`);
  }
  
  setFormatter(formatter: LogFormatter): void {
    this.formatter = formatter;
  }
  
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export class Logger {
  private transports: LogTransport[] = [];
  private context: Record<string, any> = {};
  
  constructor(transports: LogTransport[] = [new ConsoleTransport()]) {
    this.transports = transports;
  }
  
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }
  
  removeTransport(transport: LogTransport): void {
    const index = this.transports.indexOf(transport);
    if (index !== -1) {
      this.transports.splice(index, 1);
    }
  }
  
  setContext(context: Record<string, any>): void {
    this.context = context;
  }
  
  addContext(key: string, value: any): void {
    this.context[key] = value;
  }
  
  trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }
  
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }
  
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }
  
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }
  
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }
  
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: {
        ...this.context,
        ...context
      },
      error
    };
    
    for (const transport of this.transports) {
      transport.log(entry);
    }
  }
}

export class LoggerFactory {
  private static defaultLogger: Logger;
  private static loggers: Map<string, Logger> = new Map();
  
  static getLogger(name?: string): Logger {
    if (!name) {
      if (!this.defaultLogger) {
        this.defaultLogger = new Logger();
      }
      return this.defaultLogger;
    }
    
    let logger = this.loggers.get(name);
    if (!logger) {
      logger = new Logger();
      logger.addContext('logger', name);
      this.loggers.set(name, logger);
    }
    
    return logger;
  }
  
  static configureLogger(name: string, transports: LogTransport[]): Logger {
    const logger = new Logger(transports);
    logger.addContext('logger', name);
    this.loggers.set(name, logger);
    return logger;
  }
  
  static configureDefaultLogger(transports: LogTransport[]): Logger {
    this.defaultLogger = new Logger(transports);
    return this.defaultLogger;
  }
}
