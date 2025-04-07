import winston from "winston";

interface CustomLevels {
  levels: {
    [level: string]: number;
  };
  colors: {
    [level: string]: string;
  };
}

const myCustomLevels: CustomLevels = {
  levels: {
    error: 0,
    warn: 1,
    catch: 2,
    info: 3,
    http: 4,
    verbose: 5,
    debug: 6,
    silly: 7,
  },
  colors: {
    error: "bold red",
    warn: "bold yellow",
    catch: "bold gray",
    info: "bold blue",
    http: "green",
    verbose: "white",
    debug: "cyan",
    silly: "magenta",
  },
};

const myFormat = winston.format.printf(({ level, message, timestamp }: { level: string, message: string, timestamp: string }) => {
  return `${new Date(Date.now()).toUTCString()} ${level}: ${message}`;
});
winston.addColors(myCustomLevels.colors);

const logger = winston.createLogger({
  format: winston.format.combine(myFormat),
  levels: myCustomLevels.levels,
  transports: [
    new winston.transports.Console({
      level: "silly",
      format: winston.format.combine(winston.format.colorize(), myFormat),
    }),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "warn.log", level: "warn" }),
    new winston.transports.File({ filename: "catch.log", level: "catch" }),
    new winston.transports.File({ filename: "info.log", level: "info" }),
    new winston.transports.File({ filename: "http.log", level: "http" }),
    new winston.transports.File({ filename: "verbose.log", level: "verbose" }),
    new winston.transports.File({ filename: "debug.log", level: "debug" }),
    new winston.transports.File({ filename: "silly.log", level: "silly" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

export const logError = (message: string): void => {
  logger.error(message);
};

export const logWarn = (message: string): void => {
  logger.warn(message);
};

export const logCatch = (message: string): void => {
  logger.log("catch", message);
};

export const logInfo = (message: string): void => {
  logger.info(message);
};

export const logHttp = (message: string): void => {
  logger.http(message);
};

export const logVerbose = (message: string): void => {
  logger.verbose(message);
};

export const logDebug = (message: string): void => {
  logger.debug(message);
};

export const logSilly = (message: string): void => {
  logger.silly(message);
};

export default logger;
