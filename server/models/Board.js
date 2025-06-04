const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema({
  roomId: String,
  actions: Array,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Board", boardSchema);
