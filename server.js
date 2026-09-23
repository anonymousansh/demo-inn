const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/demoinn';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const Room = require('./models/Room');
const Booking = require('./models/Booking');

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
  }
}

function seedRooms() {
  return Room.countDocuments().then((count) => {
    if (count > 0) {
      return Promise.all([
        Room.updateOne({ name: 'Standard Room' }, { $set: { price: 2000 } }),
        Room.updateOne({ name: 'Deluxe Room' }, { $set: { price: 3500 } }),
        Room.updateOne({ name: 'Family Suite' }, { $set: { price: 5000 } })
      ]);
    }

    const rooms = [
      {
        name: 'Standard Room',
        price: 2000,
        capacity: 2,
        bed: 'King Bed',
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
        features: ['Air Conditioning', 'Free Wi-Fi', 'Room Service', 'Smart TV'],
        description: 'Premium comfort for couples and business travelers.'
      },
      {
        name: 'Deluxe Room',
        price: 3500,
        capacity: 2,
        bed: 'Queen Bed',
        image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
        features: ['Air Conditioning', 'Free Wi-Fi', 'Breakfast'],
        description: 'Modern comfort with a cozy and elegant feel.'
      },
      {
        name: 'Family Suite',
        price: 5000,
        capacity: 4,
        bed: '2 Queen Beds',
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        features: ['Air Conditioning', 'Free Wi-Fi', 'Mini Fridge', 'Balcony'],
        description: 'Spacious suite ideal for family getaways.'
      }
    ];

    return Room.insertMany(rooms);
  });
}

function sendBookingEmail(booking) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'demo@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER || 'demo@gmail.com',
    to: booking.email,
    subject: 'Demo Inn Booking Confirmation',
    html: `
      <h2>Booking Confirmed</h2>
      <p>Hi ${booking.name},</p>
      <p>Your room has been booked successfully at Demo Inn.</p>
      <ul>
        <li>Room: ${booking.roomName}</li>
        <li>Check-in: ${booking.checkIn}</li>
        <li>Check-out: ${booking.checkOut}</li>
        <li>Total: ₹${booking.total}</li>
      </ul>
      <p>Contact: +91 XXXXXXXX43</p>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.log('Email error:', error.message);
    else console.log('Email sent:', info.response);
  });
}

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    console.error('Rooms API error:', error.message);
    res.status(503).json({ message: 'Database is unavailable. Check MONGODB_URI.' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Bookings API error:', error.message);
    res.status(503).json({ message: 'Database is unavailable. Check MONGODB_URI.' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { name, email, phone, roomId, roomName, checkIn, checkOut, guests, amount, total, paymentStatus } = req.body;

  if (!name || !email || !phone || !roomId || !checkIn || !checkOut) {
    return res.status(400).json({ message: 'Missing required booking information.' });
  }

  const room = await Room.findById(roomId);
  if (!room) {
    return res.status(404).json({ message: 'Room not found.' });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
  const computedTotal = Number(total || (Number(amount || room.price) * nights));

  const booking = new Booking({
    name,
    email,
    phone,
    roomId: room._id,
    roomName: room.name,
    checkIn,
    checkOut,
    guests: Number(guests || 1),
    amount: Number(amount || room.price),
    total: computedTotal,
    paymentStatus: paymentStatus || 'Pending',
    status: 'Confirmed'
  });

  await booking.save();
  sendBookingEmail(booking.toObject());

  return res.status(201).json({ message: 'Booking created successfully', booking });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

connectDatabase()
  .then(() => seedRooms())
  .catch((error) => console.error('Room seed error:', error.message));

app.listen(PORT, () => {
  console.log(`Demo Inn backend running on http://localhost:${PORT}`);
});
