import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { Application } from 'express';

let io: SocketIOServer;

export function initSocketIO(httpServer: http.Server): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "http://localhost:3000", // Adjust if your frontend runs on a different port
      methods: ["GET", "POST"]
    }
  });
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
}
