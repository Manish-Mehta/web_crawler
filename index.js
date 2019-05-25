require('dotenv').config();
require('./db/mongoose')
const MEDIUM_URL = 'https://medium.com';

const lib = require('./lib');

lib.scrapeMedium(MEDIUM_URL);