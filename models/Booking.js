const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  roomName: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  guests: { type: Number, default: 1 },
  amount: { type: Number, required: true },
  total: { type: Number, required: true },
  paymentStatus: { type: String, default: 'Pending' },
  status: { type: String, default: 'Confirmed' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
