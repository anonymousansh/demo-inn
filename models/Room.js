const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  bed: { type: String, required: true },
  image: { type: String, required: true },
  features: [{ type: String }],
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
