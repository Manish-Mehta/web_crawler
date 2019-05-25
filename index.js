require('dotenv').config(); //load all the config in Environment Variables
require('./db/mongoose'); //start DB connection

const MEDIUM_URL = 'https://medium.com';
const lib = require('./lib');

lib.scrapeMedium(MEDIUM_URL);