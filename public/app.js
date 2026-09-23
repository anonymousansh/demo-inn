const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

async function loadRooms() {
  const select = document.getElementById('roomId');
  const roomsGrid = document.getElementById('roomsGrid');

  try {
    const response = await fetch(`${API_BASE}/api/rooms`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Rooms could not be loaded.');
    }
    const rooms = await response.json();

    select.innerHTML = '<option value="">Choose a room</option>';
    rooms.forEach((room) => {
      const option = document.createElement('option');
      option.value = room._id || room.id;
      option.textContent = `${room.name} - ₹${room.price}/night`;
      select.appendChild(option);
    });

    roomsGrid.innerHTML = rooms.map((room) => `
    <article class="room-card">
      <img src="${room.image}" alt="${room.name}" />
      <div class="room-body">
        <div class="room-top">
          <h3>${room.name}</h3>
          <span class="price">₹${room.price}/day</span>
        </div>
        <div style="color:#64748b;">Capacity: ${room.capacity} guests</div>
        <div style="color:#64748b; margin-top: 6px;">Bed: ${room.bed}</div>
        <ul>
          ${room.features.map((feature) => `<li>✔ ${feature}</li>`).join('')}
        </ul>
      </div>
    </article>
    `).join('');
  } catch (error) {
    document.getElementById('bookingMessage').textContent = error.message;
    select.innerHTML = '<option value="">Rooms unavailable</option>';
  }
}

document.getElementById('bookingForm').addEventListener('submit', async function (event) {
  event.preventDefault();
  const message = document.getElementById('bookingMessage');
  const button = event.target.querySelector('button[type="submit"]');
  message.textContent = '';

  const roomId = document.getElementById('roomId').value;
  const checkIn = document.getElementById('checkIn').value;
  const checkOut = document.getElementById('checkOut').value;

  if (!checkIn || !checkOut) {
    message.textContent = 'Please choose check-in and check-out dates.';
    return;
  }

  if (!roomId) {
    message.textContent = 'Please select a room.';
    return;
  }

  button.disabled = true;
  button.textContent = 'Opening checkout...';

  try {
    const roomResponse = await fetch(`${API_BASE}/api/rooms`);
    if (!roomResponse.ok) {
      const error = await roomResponse.json().catch(() => ({}));
      throw new Error(error.message || 'Rooms could not be loaded.');
    }
    const rooms = await roomResponse.json();
    const selectedRoom = rooms.find((room) => String(room._id || room.id) === String(roomId));

    if (!selectedRoom) throw new Error('Please select a valid room.');

    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));

    const params = new URLSearchParams({
      roomId: selectedRoom._id || selectedRoom.id,
      roomName: selectedRoom.name,
      roomPrice: selectedRoom.price,
      checkIn,
      checkOut,
      guests: document.getElementById('guests').value
    });

    sessionStorage.setItem('demoInnBookingGuest', JSON.stringify({
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value
    }));

    const checkoutUrl = window.location.protocol === 'file:'
      ? `http://localhost:3000/checkout?${params.toString()}`
      : `/checkout?${params.toString()}`;
    window.location.href = checkoutUrl;
  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
    button.textContent = 'Confirm Booking';
  }
});

loadRooms();
