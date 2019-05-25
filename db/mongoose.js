const mongoose = require('mongoose');
const dburl = process.env.DB_URL;

mongoose.Promise = Promise;
mongoose.connect(dburl, {
  useNewUrlParser: true, autoReconnect: true,
  poolSize: 10, reconnectTries: 5,
  reconnectInterval: 500, connectTimeoutMS: 10000,
  socketTimeoutMS: 45000, family: 4
});

var db = mongoose.connection;

db.on('error', (err) => console.log("error in mongodb connection", err));
db.once('open', () => console.log('Database connection successfull.'));