import { Server } from 'socket.io';

export async function GET(req: any) {
  if (!global.io) {
    const io = new Server(req.socket.server, {
      path: '/api/socket',
      cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
      console.log('Monitor conectado');
    });

    global.io = io;
  }

  return new Response(null);
}
