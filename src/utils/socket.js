// src/utils/socket.js
import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket;
let boundUserId = null;

// Wire up lifecycle listeners and (re)join the user's room. Re-joining on every
// `connect` ensures room membership survives reconnects after network drops.
function bindSocketEvents(sock, userId) {
  sock.off('connect');
  sock.on('connect', () => {
    console.log('✅ WebSocket Connected:', sock.id);
    if (userId) sock.emit('join', userId);
  });

  sock.off('connect_error');
  sock.on('connect_error', (err) => {
    console.log('❌ WebSocket Error:', err.message);
  });

  sock.off('disconnect');
  sock.on('disconnect', (reason) => {
    console.log('🔌 WebSocket Disconnected:', reason);
  });

  // Already connected (e.g. re-binding an existing socket): join immediately.
  if (sock.connected && userId) {
    sock.emit('join', userId);
  }
}

export const initSocket = (userId, token) => {
  if (!userId) return socket || null;

  // Reuse the live socket only if it belongs to the same user.
  if (socket && boundUserId === userId) {
    bindSocketEvents(socket, userId);
    return socket;
  }

  // A different user (or a stale socket) — tear it down before recreating so we
  // never keep a previous user's connection/room membership around.
  if (socket) {
    socket.disconnect();
    socket = null;
    boundUserId = null;
  }

  socket = io(API_BASE_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: { userId, token },
  });

  boundUserId = userId;
  bindSocketEvents(socket, userId);
  return socket;
};

export const getSocket = (userId, token) => {
  if (!socket) return initSocket(userId, token);
  // If the logged-in user changed, rebuild the socket for the new identity.
  if (userId && boundUserId !== userId) return initSocket(userId, token);
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  boundUserId = null;
};
