import winston from 'winston';

let logger: winston.Logger;

export function getLogger() {
    if (logger === undefined) {
        logger = winston.createLogger({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.padLevels(),
                winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
            ),
            transports: [new winston.transports.Console()]
        });
    }
    return logger;
}
