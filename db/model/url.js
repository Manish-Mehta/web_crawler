const mongoose = require('mongoose');

var urlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  refernceCount: { type: Number, required: true, default: 1 },
  paramList: { type: [String], required: true },
})

module.exports = mongoose.model('Url', urlSchema)