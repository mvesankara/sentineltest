import http from 'http';
import { app } from './server';
import { initSocketIO } from './services/ioService';
import { Request, Response } from 'express';

const PORT = process.env.PORT || 3001;

const httpServer = http.createServer(app);
const io = initSocketIO(httpServer); // Initialize Socket.IO

// Basic Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected to Socket.io:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO initialized and listening for connections.`);
});
