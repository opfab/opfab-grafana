import winston from 'winston';

export function getLogger(): winston.Logger {
    return winston.createLogger({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.align(),
            winston.format.timestamp(),
            winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
        ),
        transports: [new winston.transports.Console()]
    });
}
