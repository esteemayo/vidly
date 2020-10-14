const winston = require('winston');
// require('winston-mongodb');
require('express-async-errors');

module.exports = () => {
    // winston.add(winston.transports.File, { filename: 'logfile.log' });

    process.on('uncaughtException', ex => {
        console.log('WE GOT AN UNCAUGHT EXCEPTION');
        winston.error(ex.message, ex);
        process.exit(1);
    });

    winston.exceptions.handle(
        new winston.transports.Console({ colorize: true, prettyPrint: true }),
        new winston.transports.File({ filename: 'uncaughtExceptions.log' })
    );

    process.on('unhandledRejection', ex => {
        // console.log('WE GOT AN UNHANDLED REJECTION');
        // winston.error(ex.message, ex);
        // process.exit(1);
        throw(ex);
    });

    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        defaultMeta: { service: 'user-service' },
        transports: [
            new winston.transports.File({filename: 'logfile.log'})        
        ]
    });

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston.transports.Console({
            format: winston.format.simple(),
        }));
    }

    // winston.add(new winston.transports.MongoDB({ 
    //     db: 'mongodb://localhost:27017/vidly_node',
    //     level: 'error',
    //     options: {
    //         useUnifiedTopology: true
    //     } 
    // }));
}