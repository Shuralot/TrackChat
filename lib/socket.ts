import { Server } from 'socket.io';

export const initSocket = (server: any) => {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log('Monitor conectado');
  });

  return io;
};
