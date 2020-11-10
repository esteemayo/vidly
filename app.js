const express = require('express');
const winston = require('winston');
const config = require('config');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = express();

require('./startup/routes')(app);
require('./startup/db')();
require('./startup/logging')();
// require('./startup/config')();
require('./startup/validation');
require('./startup/prod')(app);

const PORT = process.env.PORT || config.get('port');

const server = app.listen(PORT, () => winston.info(`Listening on port ${PORT}`));

module.exports = server;