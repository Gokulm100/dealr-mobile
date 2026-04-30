// src/utils/socket.js
import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket;

export const initSocket = (userId) => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        userId: userId, // Pass userId for backend handshake
      },
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.log('❌ WebSocket Error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket Disconnected:', reason);
    });
  }
  return socket;
};

export const getSocket = (userId) => {
  if (!socket) {
    return initSocket(userId);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
